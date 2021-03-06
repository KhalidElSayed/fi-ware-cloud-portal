/*
The MIT License

Copyright (c) 2012 Universidad Politecnica de Madrid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// JSTACK API
// ----------

// JSTACK API is an implementation of OpenStack API in JavaScript
// that enables the use of its components (Keystone, Nova, ...) in
// web applications.

// It also provides command line access through a Node.js package.

var JSTACK = JSTACK || {};

// Current version is **0.1**.

JSTACK.VERSION = '0.1';

// It has been developed by GING (New Generation Internet Group) in
// the Technical University of Madrid.
JSTACK.AUTHORS = 'GING';
/*
The MIT License

Copyright (c) 2012 Universidad Politecnica de Madrid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// JSTACK Communication Module
// ---------------------------

// This module provides functions to send GET, POST, PUT and DELETE HTTP requests
// to OpenStack components. It is compatible with the token-based authentication
// proposed by Keystone.

JSTACK.Comm = (function (JS, undefined) {
    "use strict";

    var send, get, head, post, put, patch, del, getEndpoint;

    // Private functions
    // -----------------

    // Function `_send` is internally used to make detailed low-level requests
    // to components.
    send = function (method, url, data, token, callBackOK, callbackError, headers) {
        var xhr, body, result;

        callbackError = callbackError || function(resp) {
            //console.log("Error: ", resp);
        };
        callBackOK = callBackOK || function(resp, headers) {
            //console.log("OK: ", resp, headers);
        };

        // This function receives a `method` that can be "GET", "POST", "PUT", or
        // "DELETE". It also receives the `url` to which it has to send the request,
        // the `data` to be sent, that has to be a JSON object, the ´token´ to
        // authenticate the request, and success and error callbacks.
        xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        
        xhr.setRequestHeader("Accept", "application/json");
        if (token !== undefined) {
            xhr.setRequestHeader('X-Auth-Token', token);
        }
        var hasContent = false;
        if (headers) {
            for (var head in headers) {
                if (head === "Content-Type") hasContent = true;
                xhr.setRequestHeader(head, headers[head]);
                console.log("Header set: ", head, " - ", headers[head]);
            }
        }
        if (data && !hasContent) {
            xhr.setRequestHeader("Content-Type", "application/json");
        }

        xhr.onerror = function(error) {
            callbackError({message:"Error", body:error});
        }
        xhr.onreadystatechange = function () {

            // This resolves an error with Zombie.js
            if (flag) {
                return;
            }

            if (xhr.readyState === 4) {
                flag = true;
                switch (xhr.status) {
                // In case of successful response it calls the `callbackOK` function.
                case 100:
                case 200:
                case 201:
                case 202:
                case 203:
                case 204:
                case 205:
                case 206:
                case 207:
                    result = undefined;
                    if (xhr.responseText !== undefined && xhr.responseText !== '') {
                        result = JSON.parse(xhr.responseText);
                    }
                    callBackOK(result, xhr.getAllResponseHeaders());
                    break;

                // In case of error it sends an error message to `callbackError`.
                default:
                    callbackError({message:xhr.status + " Error", body:xhr.responseText});
                }
            }
        };
        var flag = false;
        if (data !== undefined) {
            body = JSON.stringify(data);
            try {
                xhr.send(body);
            } catch (e) {
                //callbackError(e.message);
                return;
            }
        } else {
            try {
                xhr.send();
            } catch (e) {
                //callbackError(e.message);
                return;
            }
        }
    };

    // Public functions
    // ----------------

    // * Function *get* receives the `url`, the authentication token
    // (which is optional), and callbacks. It sends a HTTP GET request,
    // so it does not send any data.
    get = function (url, token, callbackOK, callbackError, headers) {
        send("get", url, undefined, token, callbackOK, callbackError);
    };
    // * Function *head* receives the `url`, the authentication token
    // (which is optional), and callbacks. It sends a HTTP HEAD request,
    // so it does not send any data.
    head = function (url, token, callbackOK, callbackError, headers) {
        send("head", url, undefined, token, callbackOK, callbackError);
    };
    // * Function *post* receives the `url`, the authentication token
    // (which is optional), the data to be sent (a JSON Object), and
    // callbacks. It sends a HTTP POST request.
    post = function (url, data, token, callbackOK, callbackError, headers) {
        send("POST", url, data, token, callbackOK, callbackError);
    };
    // * Function *put* receives the same parameters as post. It sends
    // a HTTP PUT request.
    put = function (url, data, token, callbackOK, callbackError, headers) {
        send("PUT", url, data, token, callbackOK, callbackError, headers);
    };
    // * Function *patch* receives the same parameters as post. It sends
    // a HTTP PATC request.
    patch = function (url, data, token, callbackOK, callbackError, headers) {
        headers["Content-Type"] = 'application/openstack-images-v2.1-json-patch';
        send("PATCH", url, data, token, callbackOK, callbackError, headers);
    };
    // * Function *del* receives the same paramaters as get. It sends a
    // HTTP DELETE request.
    del = function (url, token, callbackOK, callbackError, headers) {
        send("DELETE", url, undefined, token, callbackOK, callbackError);
    };

    getEndpoint = function (serv, region, type) {
        var endpoint;
        for (var e in serv.endpoints) {
            if (serv.endpoints[e].region === region) {
                endpoint = serv.endpoints[e][type];
                break;
            }
        }
        if (!endpoint) endpoint = serv.endpoints[0][type];
        return endpoint;
    };

    // Public Functions and Variables
    // ------------------------------
    // This is the list of available public functions and variables
    return {

        // Functions:
        get : get,
        head : head,
        post : post,
        put : put,
        patch: patch,
        del : del,
        getEndpoint: getEndpoint
    };
}(JSTACK));
/*
 The MIT License

 Copyright (c) 2012 Universidad Politecnica de Madrid

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

JSTACK.Utils = (function(JS, undefined) {

    "use strict";

    var keyStr, utf8_encode, utf8_decode, encode, decode;

    // private property
    keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    // private method for UTF-8 encoding
    utf8_encode = function (string) {
        var utftext = "", n, c;

        string = string.replace(/\r\n/g, "\n");

        for (n = 0; n < string.length; n = n + 1) {

            c = string.charCodeAt(n);

            if (c < 128) {
                utftext = utftext + String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext = utftext + String.fromCharCode((c >> 6) | 192);
                utftext = utftext + String.fromCharCode((c & 63) | 128);
            } else {
                utftext = utftext + String.fromCharCode((c >> 12) | 224);
                utftext = utftext + String.fromCharCode(((c >> 6) & 63) | 128);
                utftext = utftext + String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    };

    // private method for UTF-8 decoding
    utf8_decode = function (utftext) {
        var string = "", i = 0, c = 0, c1 = 0, c2 = 0, c3 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string = string + String.fromCharCode(c);
                i = i + 1;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string = string + String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i = i + 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i = i + 3;
            }

        }
        return string;
    };

    // public method for encoding
    encode = function (input) {
        var output = "", chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;

        input = utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i = i + 1);
            chr2 = input.charCodeAt(i = i + 1);
            chr3 = input.charCodeAt(i = i + 1);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);

        }

        return output;
    };

    // public method for decoding
    decode = function (input) {
        var output = "", chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = JS.Utils.keyStr.indexOf(input.charAt(i = i + 1));
            enc2 = JS.Utils.keyStr.indexOf(input.charAt(i = i + 1));
            enc3 = JS.Utils.keyStr.indexOf(input.charAt(i = i + 1));
            enc4 = JS.Utils.keyStr.indexOf(input.charAt(i = i + 1));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 !== 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = utf8_decode(output);

        return output;
    };

    return {
        encode : encode,
        decode : decode
    };
}(JSTACK));/*
The MIT License

Copyright (c) 2012 Universidad Politecnica de Madrid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// Keystone API Module
// -------------------

// This file provides functions to access Keystone API's operations,
// such as authenticate and  gettenants.

JSTACK.Keystone = (function (JS, undefined) {

    "use strict";

    var params, STATES, init, authenticate, gettenants, getservicelist, getservice, createuser, edituser, getusers, getusersfortenant, getuser, deleteuser, getroles, getuserroles, adduserrole, removeuserrole, createtenant, edittenant, deletetenant;

    // `STATES` defines different authentication states. This
    // can be useful for applications to know when they can
    // access to authentication tokens.

    STATES = {
        DISCONNECTED : 0,
        AUTHENTICATING : 1,
        AUTHENTICATED : 2,
        AUTHENTICATION_ERROR : 3
    };

    // `params` stores info about Keystone service:
    params = {
        // * **url** points to Keystone location. Typically it could be http://host:5000/
        url : undefined,
        // * **currentstate** stores the state of this API based on options given by `STATES`
        currentstate : undefined,
        // * **access** stores the last information retreived during last successful authentication
        access : undefined,
        // * **token** gives the authentication info obtained during last successful authentication
        token : undefined
    };

    // We need to initialize this API by passing the Keystone's URL. This URL usually follows the next
    // pattern: http://host:5000/
    // This API will initialize parameters such as `currentstate`, `token` and `access`.
    init = function (keystoneUrl, adminUrl) {
        console.log("Admin URL" + adminUrl);
        params.url = keystoneUrl;
        params.adminUrl = adminUrl;
        params.access = undefined;
        params.token = undefined;
        params.currentstate = STATES.DISCONNECTED;
    };
    // Authentication function
    // ------------------------
    // This API offers Keystone authentication.
    authenticate = function (username, password, token, tenant, callback, error) {
        var credentials = {}, onOK, onError;
        // This authentication needs a `username`, a `password`. Or a `token`.
        if (token !== undefined) {
            credentials = {
                "auth" : {
                    "token" : {
                        "id" : token
                    }
                }
            };
        } else {
            credentials = {
                "auth" : {
                    "passwordCredentials" : {
                        "username" : username,
                        "password" : password
                    }
                }
            };
        }

        // User also can provide a `tenant`.
        if (tenant !== undefined) {
            credentials.auth.tenantId = tenant;
        }

        // During authentication the state will be `AUTHENTICATION`.
        params.currentstate = STATES.AUTHENTICATING;

        // Once Keystone server sends a response to this API client it will call the function
        // `callback` with the result, if provided. It also updates the state to `AUTHENTICATED`
        // and stores result in `access`.
        onOK = function (result) {
            params.currentstate = JS.Keystone.STATES.AUTHENTICATED;
            params.access = result.access;
            params.token = params.access.token.id;
            if (callback !== undefined) {
                callback(result);
            }
        };

        // In case of an error the state will be `AUTHENTICATION_ERROR` and it throws the corresponding
        // error with its description.
        onError = function (message) {
            params.currentstate = STATES.AUTHENTICATION_ERROR;
            error(message);
        };

        // A typical response would be:
        //
        //     {
        //        "token": {
        //            "expires": "2012-03-10T15:41:58.905480",
        //            "id": "d1eb612e-24fa-48b3-93d4-fc6c90379078",
        //            "tenant": {
        //                "id": "2",
        //                "name": "demo"
        //            }
        //        },
        //        "serviceCatalog": [
        //              {
        //                "endpoints": [
        //                    {
        //                        "adminURL": "http://host.name:8774/v1.1/2",
        //                        "region": "nova",
        //                        "internalURL": "http://host.name:8774/v1.1/2",
        //                        "publicURL": "http://host.name:80/v1.1/2"
        //                    }
        //                ],
        //                "type": "compute",
        //                "name": "nova"
        //            },
        //        ],
        //        "user": {
        //            "id": "1",
        //            "roles": [
        //                {
        //                    "tenantId": "2",
        //                    "id": "1",
        //                    "name": "Admin"
        //                },
        //                {
        //                    "id": "1",
        //                    "name": "Admin"
        //                },
        //            ],
        //            "name": "admin"
        //        }
        //       }
        JS.Comm.post(params.url + "tokens", credentials, undefined, onOK, onError);
    };

    // Retreiving service information
    // ------------------------------
    // The user can also obtain information about each service which is configured in Keystone.
    getservice = function (name) {
        var index, service;

        // Only if the client is currently authenticated.
        if (params.currentstate !== STATES.AUTHENTICATED) {
            return undefined;
        }

        for (index in params.access.serviceCatalog) {
            if (params.access.serviceCatalog[index] !== undefined) {
                service = params.access.serviceCatalog[index];
                if (name === service.type) {
                    // This function will return an object with the next structure:
                    //
                    //     service: {
                    //          endpoints: [
                    //               {
                    //               adminURL: "http://host.name:8774/v1.1/2",
                    //               internalURL: "http://host.name:8774/v1.1/2",
                    //               publicURL: "http://host.name:80/v1.1/2",
                    //               region: "nova"
                    //               },
                    //               name: "nova",
                    //               type: "compute"
                    //          ]
                    //     }
                    //
                    return service;
                }
            }
        }
        return undefined;
    };

    // The user can also obtain information about all services configured in Keystone.
    getservicelist = function () {
        // Only if the client is currently authenticated.
        if (params.currentstate !== STATES.AUTHENTICATED) {
            return undefined;
        }
        return params.access.serviceCatalog;
    };

    // Tenant information function
    // ---------------------------
    // User can obtain information about available tenants.
    gettenants = function (callback, admin, error) {
        var onOK, onError;

        // Only when the user is already authenticated.
        //if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            // This function will return tenant information following next pattern:
            //
            //         tenants: {
            //                links: [
            //                        {       href: "http://host.name:5000/tenants",
            //                                rel: "prev"
            //                        }
            //                ],
            //                values: [
            //                        {
            //                                description: "test",
            //                                enabled: true,
            //                                id: "3",
            //                                name: "test"
            //                        },
            //                        {
            //                                description: "None",
            //                                enabled: true,
            //                                id: "2",
            //                                name: "demo"
            //                        },
            //                        {
            //                                description: "None",
            //                                enabled: true,
            //                                id: "1",
            //                                name: "admin"
            //                        }
            //                ]
            //         }
            //
            onOK = function (result) {
                if (callback !== undefined) {
                    callback(result);
                }
            };

            onError = function (result) {
                // If error occurs it will send its description.
                if (error !== undefined) {
                    error(result);
                }
            };

            var url = params.url;
            if (admin) {
                url = params.adminUrl
            }

            JS.Comm.get(url + "tenants", params.token, onOK, onError);
        //}
    };


    createuser = function(username, password, tenant_id, email, enabled, onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
           var data = {"user": {"name": username,
                               "password": password,
                               "tenantId": tenant_id,
                               "email": email,
                               "enabled": enabled}};
           JS.Comm.post(params.adminUrl + "users", data, params.token, onOk, onError);
        }
    };

    edituser = function(id, username, password, tenant_id, email, enabled, onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
           var data = {"user": {"name": username,
                               "tenantId": tenant_id,
                               "email": email,
                               "enabled": enabled}};

            if (password !== undefined) {
                data.user.password = password;
            }
           JS.Comm.put(params.adminUrl + "users/" + id, data, params.token, onOk, onError);
        }
    };

    getusers = function(onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            JS.Comm.get(params.adminUrl + "users", params.token, onOk, onError);
        }
    };

    getusersfortenant = function(tenant_id, onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            JS.Comm.get(params.adminUrl + "tenants/" + tenant_id + "/users", params.token, onOk, onError);
        }
    };

    getuser = function(user_id, onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            JS.Comm.get(params.adminUrl + "users/" + user_id, params.token, onOk, onError);
        }
    };

    getroles = function(onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            JS.Comm.get(params.adminUrl + "OS-KSADM/roles", params.token, onOk, onError);
        }
    };

    deleteuser = function(user_id, onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            JS.Comm.del(params.adminUrl + "users/" + user_id, params.token, onOk, onError);
        }
    };

    getuserroles = function(user_id, tenant_id, onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            var route = "";
            if (tenant_id !== undefined) {
                route = params.adminUrl + "tenants/" + tenant_id + "/users/" + user_id + "/roles";
            } else {
                route = params.adminUrl + "users/" + user_id + "/roles";
            }
            JS.Comm.get(route, params.token, onOk, onError);
        }
    };

    adduserrole = function(user_id, role_id, tenant_id, onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            var route = "";
            if (tenant_id !== undefined) {
                route = params.adminUrl + "tenants/" + tenant_id + "/users/" + user_id + "/roles/OS-KSADM/" + role_id;
            } else {
                route = params.adminUrl + "users/" + user_id + "/roles/OS-KSADM/" + role_id;
            }
            JS.Comm.put(route, {}, params.token, onOk, onError);
        }
    };

    removeuserrole = function(user_id, role_id, tenant_id, onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            var route = "";
            if (tenant_id !== undefined) {
                route = params.adminUrl + "tenants/" + tenant_id + "/users/" + user_id + "/roles/OS-KSADM/" + role_id;
            } else {
                route = params.adminUrl + "users/" + user_id + "/roles/OS-KSADM/" + role_id;
            }
            JS.Comm.del(route, params.token, onOk, onError);
        }
    };

    createtenant = function(name, description, enabled, onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
           var data = {"tenant": {"name": name,
                             "description": description,
                             "enabled": enabled}};
           JS.Comm.post(params.adminUrl + "tenants", data, params.token, onOk, onError);
        }
    };

    edittenant = function(id, name, description, enabled, onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
           var data = {"tenant": {"id": id,
                            "name": name,
                            "description": description,
                            "enabled": enabled}};
           JS.Comm.put(params.adminUrl + "tenants/" + id, data, params.token, onOk, onError);
        }
    };

    deletetenant = function(tenant_id, onOk, onError) {
        if (params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
           JS.Comm.del(params.adminUrl + "tenants/" + tenant_id, params.token, onOk, onError);
        }
    };

    // Public Functions and Variables
    // ---------------------------
    // This is the list of available public functions and variables
    return {
        // Variables:
        STATES : STATES,
        params : params,
        // Functions:
        init : init,
        authenticate : authenticate,
        gettenants : gettenants,
        getservice : getservice,
        getservicelist : getservicelist,
        createuser : createuser,
        edituser : edituser,
        getusers : getusers,
        getusersfortenant : getusersfortenant,
        getuser : getuser,
        deleteuser : deleteuser,
        getuserroles : getuserroles,
        getroles : getroles,
        adduserrole : adduserrole,
        removeuserrole : removeuserrole,
        createtenant : createtenant,
        edittenant: edittenant,
        deletetenant : deletetenant
    };
}(JSTACK));/*
The MIT License

Copyright (c) 2012 Universidad Politecnica de Madrid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// JStack Nova Module
// ------------------

// This module provides Nova API functions.
JSTACK.Nova = (function (JS, undefined) {
    "use strict";

    var params, configure, check, postAction, getserverlist, getserverdetail, getserverips,
        updateserver, createserver, deleteserver, changepasswordserver,
        rebootserverhard, rebootserversoft, resizeserver, confirmresizedserver,
        revertresizedserver, startserver, stopserver, pauseserver,
        unpauseserver, suspendserver, resumeserver, createimage, getflavorlist,
        getflavordetail, createflavor, deleteflavor, getimagelist,
        getimagedetail, deleteimage, getkeypairlist, createkeypair,
        deletekeypair, getkeypairdetail, getvncconsole, getconsoleoutput, getattachedvolumes,
        attachvolume, detachvolume, getattachedvolume,getquotalist, updatequota,
        getdefaultquotalist, getsecuritygrouplist, createsecuritygroup, getsecuritygroupdetail,
        deletesecuritygroup, createsecuritygrouprule, deletesecuritygrouprule, getsecuritygroupforserver,
        getfloatingIPpools, getfloatingIPs, getfloatingIPdetail, allocatefloatingIP, associatefloatingIP, 
        disassociatefloatingIP, releasefloatingIP;

    // This modules stores the `url`to which it will send every
    // request.
    params = {
        url : undefined,
        state : undefined,
        endpointType : "publicURL",
        service : "compute"
    };

    // Private functions
    // -----------------

    // Function `_check` internally confirms that Keystone module is
    // authenticated and it has the URL of the Nova service.
    check = function (region) {
        if (JS.Keystone !== undefined &&
                JS.Keystone.params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            var service = JS.Keystone.getservice(params.service);
            if (service) {
                params.url = JSTACK.Comm.getEndpoint(service, region, params.endpointType);
                return true;
            }
            return false;            
        }
        return false;
    };
    // This function is used internally to send Actions to server identified
    // with `id`. In `data` we pass the corresponding information about the
    // action.
    postAction = function (id, data, callback, error, region) {
        var url, onOk, onError;

        if (!check(region)) {
            return;
        }

        url = params.url + '/servers/' + id + '/action';

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, onOk, onError);
    };
    // Public functions
    // ----------------
    //

    // This function sets the endpoint type for making requests to Glance.
    // It could take one of the following values:
    // * "adminURL"
    // * "internalURL"
    // * "publicURL"
    // You can use this function to change the default endpointURL, which is publicURL.
    configure = function (endpointType) {
        if (endpointType === "adminURL" || endpointType === "internalURL" || endpointType === "publicURL") {
            params.endpointType = endpointType;
        }
    };


    // **Server Operations**

    //
    // This operation provides a list of servers associated with the account. In
    // [Create Server List](http://docs.openstack.org/api/openstack-compute/2/content/List_Servers-d1e2078.html)
    // there is more information about the JSON object that is returned.
    getserverlist = function (detailed, allTenants, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/servers';
        if (detailed !== undefined && detailed) {
            url += '/detail';
        }

        if (allTenants) {
            url += '?all_tenants=' + allTenants;
        }

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };
    // This operation returns the details of a specific server by its `id`. In
    // [Get Server Details](http://docs.openstack.org/api/openstack-compute/2/content/Get_Server_Details-d1e2623.html)
    // there is more information about the JSON object that is returned.
    getserverdetail = function (id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/servers/' + id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };
    // This operation returns the ip address of a specific server by its `id`.
    // In
    // [List Addresses](http://docs.openstack.org/api/openstack-compute/2/content/List_Addresses-d1e3014.html)
    // and in
    // [List Addresses by Network](http://docs.openstack.org/api/openstack-compute/2/content/List_Addresses_by_Network-d1e3118.html)
    // there is more information about the JSON object that is returned.
    getserverips = function (id, networkID, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/servers/' + id + '/ips';

        if (networkID !== undefined) {
            url += '/' + networkID;
        }

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };
    // This operation updates the the `name` of the server given by its `id`. In
    // [Server Update](http://docs.openstack.org/api/openstack-compute/2/content/ServerUpdate.html)
    // there is more information about the JSON object that is returned.
    updateserver = function (id, name, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }
        url = params.url + '/servers/' + id;

        if (name === undefined) {
            return;
        }

        data = {
            "server" : {
                "name" : name
            }
        };

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.put(url, data, JS.Keystone.params.token, onOK, onError);
    };
    // This operation asynchronously provisions a new server. The progress of
    // this operation depends on several factors including location of the
    // requested image, network i/o, host load, and the selected flavor. The
    // progress of the request can be checked by performing a `getserverdetail`,
    // which will return a progress attribute (0-100% completion).
    //
    // Arguments in this function are:
    //
    // a. Mandatory
    //
    // * The `name` we want to put to the new server
    //
    // * The `imageRef`, that is the id of the image we will
    // instantiate
    //
    // * The `flavorReg`, that is the id of the flavor we will use
    //
    // b. Optional
    //
    // * The `key_name` that corresponds to the name of the key we will
    // later use to access the instance by SSH (default is None)
    //
    // * Some raw data as `user_data` (default is None)
    //
    // * An array with names of the `security_groups` in which we want to
    // put our instance (default is none)
    //
    // * The minimum number of instances to be started as `min_count` (
    // default is 1)
    //
    // * The maximum number of instances as `max_count` (default is 1)
    //
    // * And the `availability_zone` (default is None)
    //
    // In [Create Servers](http://docs.openstack.org/api/openstack-compute/2/content/CreateServers.html)
    // there is more information about the JSON object that is returned.
    createserver = function (name, imageRef, flavorRef, key_name, user_data, security_groups, min_count, max_count, availability_zone, networks, block_device_mapping, callback, error, region) {
        var url, onOK, onError, data, groups = [], i, group, nets = [], network, urlPost;
        if (!check(region)) {
            return;
        }

        data = {
            "server" : {
                "name" : name,
                "imageRef" : imageRef,
                "flavorRef" : flavorRef
                //"nics": nics
            }
        };

        if (block_device_mapping !== undefined) {
            urlPost = "/os-volumes_boot";      
        } else {
            urlPost = "/servers";
        }

        if (key_name !== undefined) {
            data.server.key_name = key_name;
        }

        if (user_data !== undefined) {
            data.server.user_data = JS.Utils.encode(user_data);
        }

        if (block_device_mapping !== undefined) {
            data.server.block_device_mapping = block_device_mapping;
        }

        if (security_groups !== undefined) {
            for (i in security_groups) {
                if (security_groups[i] !== undefined) {
                    group = {
                        "name" : security_groups[i]
                    };
                    groups.push(group);
                }
            }

            data.server.security_groups = groups;
        }

        if (min_count === undefined) {
            min_count = 1;
        }

        data.server.min_count = min_count;

        if (max_count === undefined) {
            max_count = 1;
        }

        data.server.max_count = max_count;

        if (availability_zone !== undefined) {
            data.server.availability_zone = JS.Utils.encode(availability_zone);
        }

        if (networks !== undefined) {
            for (i in networks) {
                if (networks[i] !== undefined) {
                    nets.push(networks[i]);
                }
            }
            data.server.networks = nets;
        }

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(params.url + urlPost, data, JS.Keystone.params.token, onOK, onError);

    };
    // This operation deletes a cloud server instance from the system.
    // In [Delete Server](http://docs.openstack.org/api/openstack-compute/2/content/Delete_Server-d1e2883.html)
    // there is more information.
    deleteserver = function (id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/servers/' + id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }

        };

        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);
    };
    // **Server Actions**
    //
    // Take a look at `postAction` for detailed information about requests.

    //
    // This operation changes the server's administrator password.
    // In [Change Password](http://docs.openstack.org/api/openstack-compute/2/content/Change_Password-d1e3234.html)
    // there is more information.
    changepasswordserver = function (id, adminPass, callback, error, region) {
        var data;
        if (adminPass === undefined) {
            return;
        }

        data = {
            "changePassword" : {
                "adminPass" : adminPass
            }
        };

        postAction(id, data, callback, error);
    };
    // This operation allows for a hard reboot that is the equivalent of power
    // cycling the server.
    rebootserverhard = function (id, callback, error, region) {
        postAction(id, {
            "reboot" : {
                "type" : "HARD"
            }
        }, callback, error);
    };
    // This operation allows for a soft reboot, which allows for a graceful
    // shutdown of all processes.
    // In [Reboot Server](http://docs.openstack.org/api/openstack-compute/2/content/Reboot_Server-d1e3371.html)
    // there is more information about hard and soft reboots.
    rebootserversoft = function (id, callback, error, region) {
        postAction(id, {
            "reboot" : {
                "type" : "SOFT"
            }
        }, callback, error);
    };
    // The resize function converts an existing server to a different flavor,
    // in essence, scaling the server up or down. The original server is saved
    // for a period of time to allow rollback if there is a problem. All resizes
    // should be tested and explicitly confirmed with `confirmresizedserver`, at
    // which time the original server is removed. All resizes are automatically
    // confirmed after 24 hours if they are not explicitly confirmed or reverted.
    // In [Resize Server](http://docs.openstack.org/api/openstack-compute/2/content/Resize_Server-d1e3707.html)
    // there is more information.
    resizeserver = function (id, flavorRef, callback, error, region) {
        postAction(id, {
            "resize" : {
                "flavorRef" : flavorRef
            }
        }, callback, error);
    };
    // During a resize operation, the original server is saved for a period of
    // time to allow roll back if there is a problem. Once the newly resized
    // server is tested and has been confirmed to be functioning properly, use
    // this operation to confirm the resize. After confirmation, the original
    // server is removed and cannot be rolled back to. All resizes are
    // automatically confirmed after 24 hours if they are not explicitly
    // confirmed or reverted.
    // In [Confirm Resized Server](http://docs.openstack.org/api/openstack-compute/2/content/Confirm_Resized_Server-d1e3868.html)
    // there is more information.
    confirmresizedserver = function (id, callback, error, region) {
        postAction(id, {
            "confirmResize" : null
        }, callback, error);
    };
    // In [Revert Resized Server](http://docs.openstack.org/api/openstack-compute/2/content/Revert_Resized_Server-d1e4024.html)
    // there is more information.
    revertresizedserver = function (id, callback, error, region) {
        postAction(id, {
            "revertResize" : null
        }, callback, error);
    };
    // It halts a running server. Changes status to STOPPED.
    // In [Start Server](http://api.openstack.org/) there is more information.
    startserver = function (id, callback, error, region) {
        postAction(id, {
            "os-start" : null
        }, callback, error);
    };
    // Returns a STOPPED server to ACTIVE status.
    // In [Stop Server](http://api.openstack.org/) there is more information.
    stopserver = function (id, callback, error, region) {
        postAction(id, {
            "os-stop" : null
        }, callback, error);
    };
    // It pauses a running server. Changes status to PAUSED.
    pauseserver = function (id, callback, error, region) {
        postAction(id, {
            "pause" : null
        }, callback, error);
    };
    // Returns a PAUSED server to ACTIVE status.
    unpauseserver = function (id, callback, error, region) {
        postAction(id, {
            "unpause" : null
        }, callback, error);
    };
    // It pauses a running server. Changes status to SUSPENDED.
    suspendserver = function (id, callback, error, region) {
        postAction(id, {
            "suspend" : null
        }, callback, error);
    };
    // Returns a SUSPENDED server to ACTIVE status.
    resumeserver = function (id, callback, error, region) {
        postAction(id, {
            "resume" : null
        }, callback, error);
    };
    // This action creates a new image for the given server. Once complete, a
    // new image will be available that can be used to rebuild or create servers.
    // In [Create Image](http://docs.openstack.org/api/openstack-compute/2/content/Create_Image-d1e4655.html)
    // there is more information.
    createimage = function (id, name, metadata, callback, error, region) {
        var data = {
            "createImage" : {
                'name' : name
            }
        };

        data.createImage.metadata = {};

        if (metadata !== undefined) {
            data.createImage.metadata = metadata;
        }

        postAction(id, data, callback, error);
    };
    // **Flavor Operations**

    // This operation will list all available flavors.
    // In [List Flavors](http://docs.openstack.org/api/openstack-compute/2/content/List_Flavors-d1e4188.html)
    // there is more information.
    getflavorlist = function (detailed, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/flavors';
        if (detailed !== undefined && detailed) {
            url += '/detail';
        }

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }

        };
        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };
    // This operation returns details of the specified flavor.
    // In [Get Flavor Details](http://docs.openstack.org/api/openstack-compute/2/content/Get_Flavor_Details-d1e4317.html)
    // there is more information.
    getflavordetail = function (id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/flavors/' + id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };
        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };
    // This operation creates a new flavor, using information given in arguments:
    // the `name` of the new flavor, the number of MB of `ram`, the `id` of the new
    // flavor, the number of GB of root `disk`, the number of GB of `ephemeral` disk,
    // the number of MB of `swap` space, and the `rxtx_factor`.
    // Arguments `ephemeral`, `swap`, `rxtx_factor` and `callback` are optional.
    createflavor = function (name, ram, vcpus, disk, flavorid, ephemeral, swap, rxtx_factor, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }
        url = params.url + '/flavors';
        data = {
            "flavor" : {
                "name" : name,
                "ram" : ram,
                "vcpus" : vcpus,
                "disk" : disk,
                "id" : flavorid+"",
                "swap" : 0,
                "OS-FLV-EXT-DATA:ephemeral" : 0,
                "rxtx_factor" : 0
            }
        };

        if (ephemeral !== undefined) {
            data.flavor["OS-FLV-EXT-DATA:ephemeral"] = ephemeral;
        }

        if (swap !== undefined) {
            data.flavor.swap = swap;
        }

        if (rxtx_factor !== undefined) {
            data.flavor.rxtx_factor = rxtx_factor;
        }

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };
        JS.Comm.post(url, data, JS.Keystone.params.token, onOK, onError);
    };
    // This operation deletes flavor, specified by its `id`.
    // In [Get Flavor Details](http://docs.openstack.org/api/openstack-compute/2/content/Get_Flavor_Details-d1e4317.html)
    // there is more information.
    deleteflavor = function (id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/flavors/' + id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);
    };
    // **Image Operations**

    // This operation will list all images visible by the account.
    // In-flight images will have the status attribute set to SAVING and the
    // conditional progress element (0-100% completion) will also be returned.
    // Other possible values for the status attribute include: UNKNOWN, ACTIVE,
    // SAVING, ERROR, and DELETED. Images with an ACTIVE status are available
    // for install.
    // In [List Images](http://docs.openstack.org/api/openstack-compute/2/content/List_Images-d1e4435.html)
    // there is more information.
    getimagelist = function (detailed, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/images';
        if (detailed !== undefined && detailed) {
            url += '/detail';
        }
        url += '?limit=100';

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };
    // This operation returns details of the image specified by its `id`.
    // In [Get Image Details](http://docs.openstack.org/api/openstack-compute/2/content/Get_Image_Details-d1e4848.html)
    // there is more information.
    getimagedetail = function (id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/images/' + id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };
        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };
    // This operation deletes an image from the system, specified by its `id`.
    // Images are immediately removed. Currently, there are no state transitions
    // to track the delete operation.
    // In [Delete Image](http://docs.openstack.org/api/openstack-compute/2/content/Delete_Image-d1e4957.html)
    // there is more information.
    deleteimage = function (id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/images/' + id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };
        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);
    };
    // This operation retrieves a list of available Key-pairs.
    getkeypairlist = function (callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/os-keypairs';

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };
    // This operation creates a new Key-pair.
    createkeypair = function (name, pubkey, callback, error, region) {
        var url, onOK, onError, body;
        if (!check(region)) {
            return;
        }
        url = params.url + '/os-keypairs';

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result.keypair);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };
        body = {
            'keypair' : {
                'name' : name
            }
        };

        if (pubkey !== undefined) {
            body.keypair.public_key = pubkey;

        }

        JS.Comm.post(url, body, JS.Keystone.params.token, onOK, onError);
    };
    // This operation deletes a  Key-pair.
    deletekeypair = function (id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/os-keypairs/' + id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);
    };
    // This operation shows a Key-pair associated with the account.
    getkeypairdetail = function (keypair_name,callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/os-keypairs/' + keypair_name;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };
    // Get a vnc console for an instance
    // id: The server's ID to get the vnc console from.
    // console_type: Type of vnc console to get ('novnc' or 'xvpvnc')
    getvncconsole = function (id, console_type, callback, error, region) {
        var data;
        if (!check(region)) {
            return;
        }

        if (console_type === undefined || !console_type) {
            console_type = "novnc";
        }

        data = {
            "os-getVNCConsole" : {
                'type' : console_type
            }
        };

        postAction(id, data, callback, error);
    };
    //  Get text console log output from Server.
    // id: The server's ID to get the vnc console from.
    // length: The number of tail loglines you would like to retrieve.
    getconsoleoutput = function (id, length, callback, error, region) {
        var data;
        if (!check(region)) {
            return;
        }

        if (length === undefined || !length) {
            length = 35;
        }

        data = {
            "os-getConsoleOutput" : {
                'length' : length
            }
        };

        postAction(id, data, callback, error);
    };
    //  Lists the volume attachments for the specified server.
    // id: The server's ID to get the volume attachments from.
    getattachedvolumes = function (id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/servers/' + id + '/os-volume_attachments';

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };
    // Attaches a volume to the specified server.
    // id: The server's ID.
    // volume_id: The volume's ID to be attached to the server.
    // device: The device where we want to attach this volume.
    attachvolume = function (id, volume_id, device, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }

        url = params.url + '/servers/' + id + '/os-volume_attachments';

        if (volume_id === undefined || device === undefined) {
            return;
        }

        data = {
            'volumeAttachment' : {
                'volumeId' : volume_id,
                'device' : device
            }
        };

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, onOK, onError);

    };
    // Deletes the specified volume attachment from the specified server.
    // id: The server's ID.
    // volume_id: The volume's ID to be detached from the server.
    detachvolume = function (id, volume_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/servers/' + id + '/os-volume_attachments/' + volume_id;

        if (volume_id === undefined) {
            return;
        }

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);

    };
    // Lists volume details for the specified volume attachment ID.
    // id: The server's ID.
    // volume_id: The volume's ID.
    getattachedvolume = function (id, volume_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/servers/' + id + '/os-volume_attachments/' + volume_id;

        if (volume_id === undefined) {
            return;
        }

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);

    };



    // APIs for quotas//

    // List the quotas for a specific tenant
    // tentnat_id: Id of the tenant for which we check the quota

    getquotalist = function (tenant_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-quota-sets/' + tenant_id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };
        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);

    };

    // Updates quota with the new values
    // tentnat_id: Id of the tenant for which we update the quota
    // instances, cores, ram, volumes, gigabytes, floating_ips, metadata_items, injected_files,
    // injected_file_content_bytes, injected_file_path_bytes, security_groups, security_group_rules,
    // key_pairs: New parameters for the creating quota
    // example to call API: JSTACK.Nova.updatequota("26b77c04cda6408c972244898f8a3925", 10, 30, 51200, 10, 1000, undefined, 128, 6, 10240, undefined, 10, 20, undefined, printAll);
    
    updatequota = function (
                            tenant_id, 
                            instances, 
                            cores, 
                            ram, 
                            volumes, 
                            gigabytes, 
                            floating_ips,
                            metadata_items, 
                            injected_files, 
                            injected_file_content_bytes, 
                            injected_file_path_bytes,
                            security_groups, 
                            security_group_rules, 
                            key_pairs, 
                            callback, 
                            error, region) {

        var url, data, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-quota-sets/' + tenant_id;

        if  ( (instances == undefined)&&(cores == undefined)&&(ram == undefined)&&(volumes == undefined)
            &&(gigabytes == undefined)&&(floating_ips == undefined)&&(metadata_items == undefined)
            &&(injected_files == undefined)&&(injected_file_content_bytes == undefined)
            &&(injected_file_path_bytes == undefined)&&(security_groups == undefined)&&
            (security_group_rules == undefined)&&(key_pairs == undefined) ) {
            return;
        }

        data = {
            'quota_set': {  'instances': instances, 
                            'cores': cores,
                            'ram': ram,
                            'volumes': volumes,
                            'gigabytes': gigabytes, 
                            'floating_ips': floating_ips,
                            'metadata_items': metadata_items, 
                            'injected_files': injected_files,
                            'injected_file_content_bytes': injected_file_content_bytes,
                            'injected_file_path_bytes': injected_file_path_bytes,
                            'security_groups': security_groups,
                            'security_group_rules': security_group_rules,
                            'key_pairs': key_pairs,
                            "id": tenant_id}

        };

        for (var key in data.quota_set) {
            if (data.quota_set[key] == undefined) {
                delete data.quota_set[key];
            }
        }   

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.put(url, data, JS.Keystone.params.token, onOK, onError);
    };

    // List the default quota
    // tenant_id:  Id of the tenant for which we list the default quota

    getdefaultquotalist = function (tenant_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-quota-sets/' + tenant_id + '/defaults';

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };


    // APIs for security groups

    // List the security groups

    getsecuritygrouplist = function (callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-security-groups';

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

     // Creates a new security group
     // name: name of the new security group
     // description: description for the creating security group

    createsecuritygroup = function (name, description, callback, error, region) {
        var url, data, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-security-groups';

        data = {"security_group": {
                    "name": name,
                    "description": description
                    }
        };

        onOK = function (result) {
            console.log(callback);
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, onOK, onError);

    };

    // Returns details for the specific security group
    // sec_group_id: Id of the consulting security group

    getsecuritygroupdetail = function (sec_group_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-security-groups/' + sec_group_id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);

    };

    // Deletes a security group
    // sec_group_id: Id of the security group to delete

    deletesecuritygroup = function (sec_group_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-security-groups/' + sec_group_id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);

    };

    // Creates a security group rule
    // ip_protocol, from_port, to_port, cidr, group_id, parent_group_id: New parameters for
    // the creating security group rule

    createsecuritygrouprule = function (ip_protocol, from_port, to_port, cidr, group_id, parent_group_id, callback, error, region) {
        var url, data, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-security-group-rules';

        data = {
                "security_group_rule": {
                    "ip_protocol": ip_protocol,
                    "from_port": from_port,
                    "to_port": to_port,
                    "cidr": cidr,
                    "group_id": group_id,
                    "parent_group_id": parent_group_id
                    }
        };

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, onOK, onError);

    };

    // Deletes security group rule
    // sec_group_rule_id: Id of the security group rule

    deletesecuritygrouprule = function (sec_group_rule_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-security-group-rules/' + sec_group_rule_id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);

    };

    // Consults security group for specific server
    // server_id: Id of the server for which to consult the security group

    getsecuritygroupforserver = function (server_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/servers/' + server_id + '/os-security-groups';

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);

    };

    // APIs for floating IPs

    getfloatingIPpools = function (callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-floating-ip-pools';

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            error(message);
            throw new Error(message);
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);

    };

    getfloatingIPs = function (callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-floating-ips';

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            error(message);
            throw new Error(message);
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);

    };

    getfloatingIPdetail = function (id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-floating-ips/' +id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            error(message);
            throw new Error(message);
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);

    };

    allocatefloatingIP = function (pool, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-floating-ips';

        if (pool !== undefined) {

            data = {

                "pool": pool
            };
        }         

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            error(message);
            throw new Error(message);
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, onOK, onError);

    };

    associatefloatingIP = function (server_id, address, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }

        url = params.url + '/servers/' + server_id + '/action';

        data =  {
                "addFloatingIp": {
                    "address": address
                }
        };

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            error(message);
            throw new Error(message);
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, onOK, onError);

    };

    releasefloatingIP = function (id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + '/os-floating-ips/' +id;

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            error(message);
            throw new Error(message);
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);

    };


    disassociatefloatingIP = function (server_id, address, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }

        url = params.url + '/servers/' + server_id + '/action';

        data =  {
                "removeFloatingIp": {
                    "address": address
                }
        };

        onOK = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            error(message);
            throw new Error(message);
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, onOK, onError);

    };


    // Public Functions and Variables
    // ------------------------------
    // This is the list of available public functions and variables
    return {

        // Functions:
        configure : configure,
        params : params,
        getserverlist : getserverlist,
        getserverdetail : getserverdetail,
        getserverips : getserverips,
        updateserver : updateserver,
        createserver : createserver,
        deleteserver : deleteserver,
        changepasswordserver : changepasswordserver,
        rebootserverhard : rebootserverhard,
        rebootserversoft : rebootserversoft,
        resizeserver : resizeserver,
        confirmresizedserver : confirmresizedserver,
        revertresizedserver : revertresizedserver,
        startserver : startserver,
        stopserver : stopserver,
        pauseserver : pauseserver,
        unpauseserver : unpauseserver,
        suspendserver : suspendserver,
        resumeserver : resumeserver,
        createimage : createimage,
        getflavorlist : getflavorlist,
        getflavordetail : getflavordetail,
        createflavor : createflavor,
        deleteflavor : deleteflavor,
        getimagelist : getimagelist,
        getimagedetail : getimagedetail,
        deleteimage : deleteimage,
        getkeypairlist : getkeypairlist,
        createkeypair : createkeypair,
        deletekeypair : deletekeypair,
        getkeypairdetail : getkeypairdetail,
        getvncconsole : getvncconsole,
        getconsoleoutput : getconsoleoutput,
        getattachedvolumes : getattachedvolumes,
        attachvolume : attachvolume,
        detachvolume : detachvolume,
        getattachedvolume : getattachedvolume,
        getquotalist : getquotalist,
        updatequota : updatequota,
        getdefaultquotalist : getdefaultquotalist,
        getsecuritygrouplist : getsecuritygrouplist,
        createsecuritygroup : createsecuritygroup,
        getsecuritygroupdetail : getsecuritygroupdetail,
        deletesecuritygroup : deletesecuritygroup,
        createsecuritygrouprule : createsecuritygrouprule,
        deletesecuritygrouprule : deletesecuritygrouprule,
        getsecuritygroupforserver : getsecuritygroupforserver,
        getfloatingIPpools : getfloatingIPpools,
        getfloatingIPs : getfloatingIPs,
        getfloatingIPdetail : getfloatingIPdetail,
        allocatefloatingIP : allocatefloatingIP,
        associatefloatingIP : associatefloatingIP,
        disassociatefloatingIP : disassociatefloatingIP,
        releasefloatingIP : releasefloatingIP
    };

}(JSTACK));
/*
The MIT License

Copyright (c) 2012 Universidad Politecnica de Madrid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// JStack Cinder Module
// ------------------

// Allows you to manage volumes and snapshots that can be used with the Compute API.
JSTACK.Cinder = (function (JS, undefined) {
    "use strict";
    var params, check, configure, getvolumelist, createvolume, deletevolume, getvolume,
        getsnapshotlist, createsnapshot, deletesnapshot, getsnapshot;
    // This modules stores the `url` to which it will send every
    // request.
    params = {
        url : undefined,
        state : undefined,
        endpointType : "publicURL"
    };

    // Private functions
    // -----------------

    // Function `check` internally confirms that Keystone module is
    // authenticated and it has the URL of the Volume service.
    check = function (region) {
        if (JS.Keystone !== undefined && JS.Keystone.params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            var service = JS.Keystone.getservice("volume");
            if (service) {
                params.url = JSTACK.Comm.getEndpoint(service, region, params.endpointType);
                return true;
            }
            return false;
        }
        return false;
    };
    // Public functions
    // ----------------
    //

    // This function sets the endpoint type for making requests to Glance.
    // It could take one of the following values:
    // * "adminURL"
    // * "internalURL"
    // * "publicURL"
    // You can use this function to change the default endpointURL, which is publicURL.
    configure = function (endpointType) {
        if (endpointType === "adminURL" || endpointType === "internalURL" || endpointType === "publicURL") {
            params.endpointType = endpointType;
        }
    };


    // **Volume Operations**

    //
    // View a list of simple Volume entities. In
    // [Requesting a List of Volumes](http://api.openstack.org/)
    // there is more information about the JSON object that is returned.
    getvolumelist = function (detailed, callback, error, region) {
        var url, onOk, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/volumes';
        if (detailed !== undefined && detailed) {
            url += '/detail';
        }

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOk, onError);
    };
    // Create a Volume.
    // Arguments in this function are:
    //
    // a. Mandatory
    //
    // * The `size` of volume in GB
    //
    // b. Optional
    //
    // * The `name` of the volume
    //
    // * The `description` of the volume
    //
    createvolume = function (size, name, description, callback, error, region) {
        var onOk, onError, data;
        if (!check(region)) {
            return;
        }

        data = {
            "volume" : {
                "size" : size
            }
        };

        if (name !== undefined) {
            data.volume.display_name = name;
        }

        if (description !== undefined) {
            data.volume.display_description = description;
        }

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(params.url + '/volumes', data, JS.Keystone.params.token, onOk, onError);
    };
    // Delete a Volume entitiy. In
    // [Deleting a Volume](http://api.openstack.org/)
    // there is more information about the JSON object that is returned.
    deletevolume = function (id, callback, error, region) {
        var url, onOk, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/volumes/' + id;

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOk, onError);
    };
    // Get a Volume entitiy. In
    // [Retrieving a Volume](http://api.openstack.org/)
    // there is more information about the JSON object that is returned.
    getvolume = function (id, callback, error, region) {
        var url, onOk, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/volumes/' + id;

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOk, onError);
    };
    // **Snapshot Operations**

    //
    // View a list of simple Snapshot entities. In
    // [Requesting a List of Snapshots](http://api.openstack.org/)
    // there is more information about the JSON object that is returned.
    getsnapshotlist = function (detailed, callback, error, region) {
        var url, onOk, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/snapshots';
        if (detailed !== undefined && detailed) {
            url += '/detail';
        }

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOk, onError);
    };
    // Create a Volume Snapshot.
    // Arguments in this function are:
    //
    // a. Mandatory
    //
    // * The `volume_id` of the volume
    //
    // b. Optional
    //
    // * The `name` of the snapshot
    //
    // * The `description` of the snapshot
    //
    createsnapshot = function (volume_id, name, description, callback, error, region) {
        var url, onOk, onError, data;
        if (!check(region)) {
            return;
        }

        data = {
            "snapshot" : {
                "volume_id" : volume_id,
                "force" : true
            }
        };

        if (name !== undefined) {
            data.snapshot.display_name = name;
        }

        if (description !== undefined) {
            data.snapshot.display_description = description;
        }

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(params.url + '/snapshots', data, JS.Keystone.params.token, onOk, onError);
    };
    // Delete a Snapshot entitiy. In
    // [Retrieving a Snapshot](http://api.openstack.org/)
    // there is more information about the JSON object that is returned.
    deletesnapshot = function (id, callback, error, region) {
        var url, onOk, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/snapshots/' + id;

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOk, onError);
    };
    // Get a Snapshot entitiy. In
    // [Retrieving a Snapshot](http://api.openstack.org/)
    // there is more information about the JSON object that is returned.
    getsnapshot = function (id, callback, error, region) {
        var url, onOk, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/snapshots/' + id;

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOk, onError);
    };
    // Public Functions and Variables
    // ------------------------------
    // This is the list of available public functions and variables
    return {

        // Functions:
        configure : configure,
        getvolumelist : getvolumelist,
        createvolume : createvolume,
        deletevolume : deletevolume,
        getvolume : getvolume,
        getsnapshotlist : getsnapshotlist,
        createsnapshot : createsnapshot,
        deletesnapshot : deletesnapshot,
        getsnapshot : getsnapshot
    };

}(JSTACK));/*
The MIT License

Copyright (c) 2012 Universidad Politecnica de Madrid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// JStack Glance Module
// ------------------

// This module provides Glance API functions.
JSTACK.Glance = (function(JS, undefined) {
    "use strict";
    var params, check, getVersion, configure, getimagelist, getimagedetail, updateimage;

    // This modules stores the `url`to which it will send every
    // request.
    params = {
        url: undefined,
        state: undefined,
        endpointType: "publicURL"
    };

    // Private functions
    // -----------------

    // Function `check` internally confirms that Keystone module is
    // authenticated and it has the URL of the Glance service.
    check = function(region) {
        if (JS.Keystone !== undefined && JS.Keystone.params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            var service = JS.Keystone.getservice("image");
            params.url = JSTACK.Comm.getEndpoint(service, region, params.endpointType);
            return true;
        }
        return false;
    };

    // Function `getVersion` returns the version of Glance API server is using.
    getVersion = function(region) {
        if (!check(region)) {
            return 0;
        }
        var service = JS.Keystone.getservice("image");
        params.url = JSTACK.Comm.getEndpoint(service, region, params.endpointType);
        if (params.url.match(/v1/)) {
            return 1;
        } else if (params.url.match(/v2/)) {
            return 2;
        }
        return 0;
    }

    // Public functions
    // ----------------
    //

    // This function sets the endpoint type for making requests to Glance.
    // It could take one of the following values:
    // * "adminURL"
    // * "internalURL"
    // * "publicURL"
    // You can use this function to change the default endpointURL, which is publicURL.
    configure = function(endpointType) {
        if (endpointType === "adminURL" || endpointType === "internalURL" || endpointType === "publicURL") {
            params.endpointType = endpointType;
        }
    };

    // **Image Operations**

    //
    // This operation provides a list of images associated with the account. In
    // [Requesting a List of Public VM Images](http://docs.openstack.org/cactus/openstack-compute/admin/content/requesting-vm-list.html)
    // there is more information about the JSON object that is returned.
    getimagelist = function(detailed, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/images';
        if (detailed !== undefined && detailed && url.match(/v1/)) {
            url += '/detail';
        }

        url += '?limit=100';

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    //
    // This operation provides a list of images associated with the account. In
    // [Requesting a List of Public VM Images](http://docs.openstack.org/cactus/openstack-compute/admin/content/requesting-vm-list.html)
    // there is more information about the JSON object that is returned.
    getimagedetail = function(id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/images/' + id;

        onOK = function(result, headers) {
            if (callback !== undefined) {
                switch(getVersion(region)) {
                    case 1:
                        var model = {};
                        var heads = headers.split("\r\n");
                        heads.forEach(function(head) {
                            if (head.indexOf('x-image-meta') === -1) {
                                return;
                            }
                            var reg = head.match(/^([\w\d\-\_]*)\: (.*)$/);
                            var value = reg[1];
                            var key = reg[2];
                            var data = value.split('-');
                            var attr = data[data.length - 1];
                            model[attr] = key;
                        });
                        callback(model, headers);
                        break;
                    case 2:
                        callback(result);
                        break;
                    default:
                        break;
                }
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        switch(getVersion(region)) {
            case 1:
                JS.Comm.head(url, JS.Keystone.params.token, onOK, onError);
                break;
            case 2:
                JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
                break;
            default:
                break;
        }
    };

    // This operation updates details of the image specified by its `id`.
    // In [Update Image Details](http://api.openstack.org/api-ref.html)
    // there is more information.
    updateimage = function(id, name, visibility, properties, callback, error, region) {
        var url, onOK, onError;
        var headers = {};
        var prefix = "x-image-meta-";
        if (!check(region)) {
            return;
        }
        url = params.url + '/images/' + id;
        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };
        switch(getVersion(region)) {
            case 1:
                if (name) {
                    headers[prefix+'name'] = name;
                }
                if (visibility === "public") {
                    headers[prefix+'is_public'] = "true";
                } else {
                    headers[prefix+'is_public'] = "false";
                }
                properties = properties || {};
                for (var propKey in properties) {
                    headers[prefix+"property-"+propKey] = properties[propKey];
                }
                JS.Comm.put(url, undefined, JS.Keystone.params.token, onOK, onError, headers);
                break;
            case 2:
                var data = [];
                if (name) {
                    data.push({op: "replace", path: "/name", value: name});
                }
                if (visibility) {
                    data.push({op: "replace", path: "/visibility", value: visibility});
                }
                JS.Comm.patch(url, data, JS.Keystone.params.token, onOK, onError, headers);
            default:
            break;
        }
    };
    // Public Functions and Variables
    // ------------------------------
    // This is the list of available public functions and variables
    return {

        // Functions:
        configure: configure,
        getimagelist: getimagelist,
        getimagedetail: getimagedetail,
        updateimage: updateimage,
        getVersion: getVersion
    };

}(JSTACK));/*
The MIT License

Copyright (c) 2013 Universidad Politecnica de Madrid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/// JStack Neutron Module
// ------------------

JSTACK.Neutron = (function(JS, undefined) {
    "use strict";
    var params, check, configure, getnetworkslist, createnetwork, updatenetwork, getnetworkdetail, deletenetwork,
    getsubnetslist, createsubnet, updatesubnet, getsubnetdetail, deletesubnet,
    getportslist, createport, updateport, getportdetail, deleteport, getrouterslist, createrouter, updaterouter,
    getrouterdetail, deleterouter, addinterfacetorouter, removeinterfacefromrouter;

    // This modules stores the `url`to which it will send every
    // request. 
    params = {
        url: undefined,
        state: undefined,
        endpointType: "publicURL"
    };

    // Private functions
    // -----------------

    // Function `check` internally confirms that Keystone module is
    // authenticated and it has the URL of the Glance service.
    check = function(region) {
        if (JS.Keystone !== undefined && JS.Keystone.params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            var service = JS.Keystone.getservice("network");
            if (service) {
                params.url = JSTACK.Comm.getEndpoint(service, region, params.endpointType);
            }
            return false;
        }
        return false;
    };
    // Public functions
    // ----------------
    //

    // This function sets the endpoint type for making requests to Glance.
    // It could take one of the following values:
    // * "adminURL"
    // * "internalURL"
    // * "publicURL"
    // You can use this function to change the default endpointURL, which is publicURL.
    configure = function(endpointType) {
        if (endpointType === "adminURL" || endpointType === "internalURL" || endpointType === "publicURL") {
            params.endpointType = endpointType;
        }
    };

    getnetworkslist = function(callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + 'v2.0/networks';

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    createnetwork = function(name, admin_state_up, shared, tenant_id, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }
        url = params.url + 'v2.0/networks';

        data = {
            "network" : {
            }
        };

        if (name !== undefined) {
            data.network.name = name;
        }

        if (admin_state_up !== undefined) {
            data.network.admin_state_up = admin_state_up;
        }

        if (shared !== undefined) {
            data.network.shared = shared;
        }

        if (tenant_id !== undefined) {
            data.network.tenant_id = tenant_id;
        }

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, onOK, onError);
    };

    getnetworkdetail = function(network_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + 'v2.0/networks/' + network_id;

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    updatenetwork = function(network_id, name, admin_state_up, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }
        
        url = params.url + 'v2.0/networks/' + network_id;

        data = {
            "network" : {
            }
        };

        if (name !== undefined) {
            data.network.name = name;
        }

        if (admin_state_up !== undefined) {
            data.network.admin_state_up = admin_state_up;
        }

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.put(url, data, JS.Keystone.params.token, onOK, onError);
    };

    deletenetwork = function(network_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + 'v2.0/networks/' + network_id;

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);
    };

    getsubnetslist = function(callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        
        url = params.url + 'v2.0/subnets';

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    createsubnet = function(network_id, cidr, name, allocation_pools, tenant_id, gateway_ip, ip_version, enable_dhcp, dns_nameservers, host_routes, callback, error, region) {
        var url, onOK, onError, data, i, start, end, allocation_pool, all_pools = [], dns_nameserver, dns_nservers = [], host_route, h_routes = [];
        if (!check(region)) {
            return;
        }
        
        url = params.url + 'v2.0/subnets';

        data = {
            "subnet" : {
                "network_id" : network_id,
                "cidr" : cidr,
                "ip_version" : 4
            }
        }

        if (name !== undefined) {
            data.subnet.name = name;
        }

        if (tenant_id !== undefined) {
            data.subnet.tenant_id = tenant_id;
        }

        if (allocation_pools !== undefined) {
            for (i in allocation_pools) {
                if (allocation_pools[i] !== undefined) {
                    allocation_pool = allocation_pools[i];
                    all_pools.push(allocation_pool);
                }
            }
            data.subnet.allocation_pools = all_pools;
        }

        if (gateway_ip !== undefined) {
            data.subnet.gateway_ip = gateway_ip;
        }

        if (enable_dhcp !== undefined) {
            data.subnet.enable_dhcp = enable_dhcp;
        }

        if (dns_nameservers !== undefined) {
            for (i in dns_nameservers) {
                if (dns_nameservers[i] !== undefined) {
                    dns_nameserver = dns_nameservers[i];
                    dns_nservers.push(dns_nameserver);
                }
            }
            data.subnet.dns_nameservers = dns_nservers;
        }

        if (host_routes !== undefined) {
            for (i in host_routes) {
                if (host_routes[i] !== undefined) {
                    host_route = host_routes[i];
                    h_routes.push(host_route);
                }
            }
            data.subnet.host_routes = h_routes;
        }

        JS.Comm.post(url, data, JS.Keystone.params.token, onOK, onError);
    };

    getsubnetdetail = function(subnet_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + 'v2.0/subnets/' + subnet_id;

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    updatesubnet = function(subnet_id, name, gateway_ip, enable_dhcp, dns_nameservers, host_routes, callback, error, region) {
        var url, onOK, onError, data, i, start, end, dns_nameserver, dns_nservers = [], host_route, h_routes = [];
        if (!check(region)) {
            return;
        }
        
        url = params.url + 'v2.0/subnets/' + subnet_id;

        data = {
            "subnet" : {
            }
        }

        if (name !== undefined) {
            data.subnet.name = name;
        }

        if (gateway_ip !== undefined) {
            data.subnet.gateway_ip = gateway_ip;
        }

        if (enable_dhcp !== undefined) {
            data.subnet.enable_dhcp = enable_dhcp;
        }

        if (dns_nameservers !== undefined) {
            for (i in dns_nameservers) {
                if (dns_nameservers[i] !== undefined) {
                    dns_nameserver = dns_nameservers[i];
                    dns_nservers.push(dns_nameserver);
                }
            }
            data.subnet.dns_nameservers = dns_nservers;
        }

        if (host_routes !== undefined) {
            for (i in host_routes) {
                if (host_routes[i] !== undefined) {
                    host_route = host_routes[i];
                    h_routes.push(host_route);
                }
            }
            data.subnet.host_routes = h_routes;
        }

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.put(url, data, JS.Keystone.params.token, onOK, onError);
    };

    deletesubnet = function(subnet_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        
        url = params.url + 'v2.0/subnets/' + subnet_id;

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);
    };

    getportslist = function(callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        
        url = params.url + 'v2.0/ports';

        onOK = function(result) {   
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    createport = function(network_id, name, fixed_ips, security_groups, admin_state_up, status, tenant_id, mac_address, callback, error, region) {
        var url, onOK, onError, data, groups = [], i, group, fixed_ip, fix_ips = [];
        if (!check(region)) {
            return;
        }

        url = params.url + 'v2.0/ports';

        data = {
            "port" : {
                "network_id" : network_id
            }
        };

        if (status !== undefined) {
            data.port.status = status;
        }

        if (name !== undefined) {
            data.port.name = name;
        }

        if (admin_state_up !== undefined) {
            data.port.admin_state_up = admin_state_up;
        }

        if (tenant_id !== undefined) {
            data.port.tenant_id = tenant_id;
        }

        if (mac_address !== undefined) {
            data.port.mac_address = mac_address;
        }

        if (fixed_ips !== undefined) {
            for (i in fixed_ips) {
                if (fixed_ips[i] !== undefined) {
                    fixed_ip = fixed_ips[i];
                    fix_ips.push(fixed_ip);
                }
            }

            data.port.fixed_ips = fix_ips;
        }

        if (security_groups !== undefined) {
            for (i in security_groups) {
                if (security_groups[i] !== undefined) {
                    group = security_groups[i];
                    groups.push(group);
                }
            }

            data.port.security_groups = groups;
        }

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, onOK, onError);
    };

    getportdetail = function(port_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + 'v2.0/ports/' + port_id;

        onOK = function(result) {   
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    updateport = function(port_id, name, fixed_ips, security_groups, admin_state_up, status, tenant_id, mac_address, callback, error, region) {
        var url, onOK, onError, data, groups = [], i, group, fixed_ip, fix_ips = [];
        if (!check(region)) {
            return;
        }
        
        url = params.url + 'v2.0/ports/' + port_id;

        data = {
            "port" : {
            }
        };

        if (status !== undefined) {
            data.port.status = status;
        }   

        if (name !== undefined) {
            data.port.name = name;
        }

        if (admin_state_up !== undefined) {
            data.port.admin_state_up = admin_state_up;
        }

        if (tenant_id !== undefined) {
            data.port.tenant_id = tenant_id;
        }

        if (mac_address !== undefined) {
            data.port.mac_address = mac_address;
        }

        if (fixed_ips !== undefined) {
            for (i in fixed_ips) {
                if (fixed_ips[i] !== undefined) {
                    fixed_ip = fixed_ips[i];
                    fix_ips.push(fixed_ip);
                }
            }

            data.port.fixed_ips = fix_ips;
        }

        if (security_groups !== undefined) {
            for (i in security_groups) {
                if (security_groups[i] !== undefined) {
                    group = security_groups[i];
                    groups.push(group);
                }
            }

            data.port.security_groups = groups;
        }

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.put(url, data, JS.Keystone.params.token, onOK, onError);
    };

    deleteport = function(port_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + 'v2.0/ports/' + port_id;

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);
    };

    getrouterslist = function(callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }

        url = params.url + 'v2.0/routers';

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    createrouter = function(name, admin_state_up, network_id, tenant_id, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }
        url = params.url + 'v2.0/routers';

        data = {
            "router" : {
                "external_gateway_info" : {
                }
            }
        };

        if (network_id !== undefined) {
            data.router.external_gateway_info.network_id = network_id;
        }

        if (name !== undefined) {
            data.router.name = name;
        }

        if (admin_state_up !== undefined) {
            data.router.admin_state_up = admin_state_up;
        }

        if (tenant_id !== undefined) {
            data.router.tenant_id = tenant_id;
        }

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, onOK, onError);
    };

    getrouterdetail = function(router_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + 'v2.0/routers/' + router_id;

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    updaterouter = function(router_id, network_id, name, admin_state_up, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }
        
        url = params.url + 'v2.0/routers/' + router_id;

        data = {
            "router" : {
                "external_gateway_info" : {
                }
            }
        };

        if (network_id !== undefined) {
            data.router.external_gateway_info.network_id = network_id;
        }

        if (name !== undefined) {
            data.router.name = name;
        }

        if (admin_state_up !== undefined) {
            data.router.admin_state_up = admin_state_up;
        }

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.put(url, data, JS.Keystone.params.token, onOK, onError);
    };

    deleterouter = function(router_id, callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + 'v2.0/routers/' + router_id;

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOK, onError);
    };

    addinterfacetorouter = function(router_id, subnet_id, port_id, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }
        url = params.url + 'v2.0/routers/' + router_id + '/add_router_interface';

        data = {
         
        };

        if (subnet_id !== undefined) {
            data.subnet_id = subnet_id;
        }

        if (port_id !== undefined) {
            data.port_id = port_id;
        }

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.put(url, data, JS.Keystone.params.token, onOK, onError);
    };

    removeinterfacefromrouter = function(router_id, port_id, subnet_id, callback, error, region) {
        var url, onOK, onError, data;
        if (!check(region)) {
            return;
        }

        data = {  
             
        };

        url = params.url + 'v2.0/routers/' + router_id + '/remove_router_interface';

        if (subnet_id !== undefined) {
            data.subnet_id = subnet_id;
        }

        if (port_id !== undefined) {
            data.port_id = port_id;
        }

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.put(url, data, JS.Keystone.params.token, onOK, onError);
    };

    // Public Functions and Variables
    // ------------------------------
    // This is the list of available public functions and variables
    return {
        params : params,
        // Functions:
        configure: configure,
        getnetworkslist : getnetworkslist,
        getnetworkdetail : getnetworkdetail,
        createnetwork : createnetwork,
        updatenetwork : updatenetwork,
        deletenetwork : deletenetwork,
        getsubnetslist : getsubnetslist,
        getsubnetdetail : getsubnetdetail,
        createsubnet : createsubnet,
        updatesubnet : updatesubnet,
        deletesubnet : deletesubnet,
        getportslist : getportslist,
        getportdetail : getportdetail,
        createport : createport,
        updateport : updateport,
        deleteport : deleteport,
        getrouterslist : getrouterslist,
        createrouter : createrouter,
        updaterouter : updaterouter,
        getrouterdetail :getrouterdetail,
        deleterouter : deleterouter,
        addinterfacetorouter : addinterfacetorouter,
        removeinterfacefromrouter : removeinterfacefromrouter
    };

}(JSTACK));