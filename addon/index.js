import Pretender from 'pretender';
import apiFactory from '@hashicorp/api-double';
import deepAssign from 'merge-options';
const assign = Object.assign;
export default function(path, setCookies, typeToURL) {
  const createAPI = apiFactory(12345, path);
  let api = createAPI();
  let cookies = {};
  let history = [];
  let statuses = {};
  const server = new Pretender();
  server.handleRequest = request => {
    let url = request.url.split('?')[0];
    history.push(request);
    const req = {
      path: url,
      url: url,
      query: request.queryParams || {},
      headers: request.requestHeaders,
      body: request.requestBody,
      method: request.method,
      cookies: cookies,
    };
    const response = {
      _status: 200,
      set: function() {
      },
      send: function(response) {
        request.respond(statuses[url] || this._status, { 'Content-Type': 'application/json' }, response);
      },
      status: function(status) {
        this._status = status;
      }
    };
    api.serve(req, response, function() {});
  };
  return {
    server: {
      history: history,
      reset: function() {
        api = createAPI();
        cookies = {};
        statuses = {};
        history = [];
        this.history = history;
      },
      respondWithStatus: function(url, s) {
        statuses[url] = s;
      },
      createList: function(type, num, value) {
        const url = typeToURL(type);
        cookies = setCookies(type, num, cookies);
        if (url && value) {
          api.mutate(function(response, config) {
            return response.map((item, i, arr) => {
              let res = value;
              if (typeof value === 'object') {
                if (value.constructor == Object) {
                  // res = { ...item, ...value };
                  if(typeof item === 'string') {
                    res = value.toString();
                  } else {
                    res = deepAssign(item, value);
                  }
                } else if (value.constructor == Array) {
                  // res = { ...item, ...value[i] };
                  if(value[i]) {
                    if(typeof value[i] === "object") {
                      res = deepAssign(item, value[i]);
                    } else {
                      res = value[i];
                    }
                  }
                }
              }
              return res;
            });
          }, url);
        }
      },
    },
  };

}
