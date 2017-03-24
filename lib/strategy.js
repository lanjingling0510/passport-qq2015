'use strict';
/**
 * Module dependencies.
 */

/* eslint-disable */
const util = require('util');
const querystring = require('querystring');
const passport = require('passport-strategy');
const request = require('request');



function QQTokenStrategy(options, verify) {
  if (typeof options == 'function') {
    verify = options;
    options = {};
  }
  if (!verify) { throw new TypeError('LocalStrategy requires a verify callback'); }

  passport.Strategy.call(this);
  this.name = 'qq-token';
  this._verify = verify;

  // 请求地址
  this.authorizationURL = options.authorizationURL || 'https://graph.qq.com/oauth2.0/authorize';
  this.tokenURL = options.tokenURL || 'https://graph.qq.com/oauth2.0/token';
  this.openIdURL = options.openIdURL || 'https://graph.qq.com/oauth2.0/me';
  this.userInfoURL = options.userInfoURL || 'https://graph.qq.com/user/get_user_info';

  // 获取Authorization Code的参数
  this._authorizationCodeUrlParams = {
    response_type: 'code',
    client_id: options.clientID,
    redirect_uri: options.callbackURL,
    scope: options.scope || 'get_user_info',
    display: options.display || null,
  };

  // 通过Authorization Code获取Access Token的参数
  this._accessTokenUrlParams = {
    grant_type: 'authorization_code',
    client_id: options.clientID,
    client_secret: options.clientSecret,
    code: null,
    redirect_uri: options.callbackURL,
  };

  // 获取用户OpenID_OAuth2.0的参数
  this._openIdUrlParams = {
    access_token: null,
  };


  // 调用OpenAPI接口的参数
  this._userInfoUrlParams = {
    access_token: null,
    openid: null,
    oauth_consumer_key: options.clientID,
  };


}

/**
 * Inherit from `Strategy`.
 */
util.inherits(QQTokenStrategy, passport.Strategy);


const get = (url) => {
  return new Promise((res, rej) => {
    request({
      type: 'GET',
      uri: url
    }, (err, response, body) => {
      if (err) rej(err);
      res(body);
    });
  });
}


QQTokenStrategy.prototype.authenticate = function (req, options) {
  const authorizationCodeUrlParams = Object.assign({}, this._authorizationCodeUrlParams);
  const accessTokenUrlParams = Object.assign({}, this._accessTokenUrlParams);
  const openIdUrlParams = Object.assign({}, this._openIdUrlParams);
  const userInfoUrlParams = Object.assign({}, this._userInfoUrlParams);

  let url;
  let access_token;
  let refresh_token;
  let openID;
  let profile;

  if (req.query && req.query.code) {
    accessTokenUrlParams.code = req.query.code;
    url = this.tokenURL + '?' + querystring.stringify(accessTokenUrlParams);
    get(url)
      // get access_token
      .then((data) => {
        const result = querystring.parse(data);
        console.log(result);
	access_token = result.access_token;
        refresh_token = result.refresh_token;
        openIdUrlParams.access_token = access_token;
      
      url = this.openIdURL + '?' + querystring.stringify(openIdUrlParams);
        return get(url);
      })
      // get openID
      .then((data) => {
        const result = JSON.parse(data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1));
	console.log(result);
        openID = result.openid;
        userInfoUrlParams.access_token = access_token;
      userInfoUrlParams.openid = openID;
        url = this.userInfoURL + '?' + querystring.stringify(userInfoUrlParams);
        return get(url);
      })

      // 获取到用户数据
      .then((data) => {
        profile = data;



        const verified =  (err, user, info) => {
          if (err) {
            return this.error(err);
          }
          if (!user) {
            return this.fail(info);
          }
          this.success(user, info);
        }

        this._verify(access_token, refresh_token, profile, verified);
      }).catch(err => {
        return this.fail(err);
      });
  } else {
    url = this.authorizationURL + '?' + querystring.stringify(authorizationCodeUrlParams);
    this.redirect(url);
  }
};


/**
 * Expose `Strategy`.
 */
module.exports.Strategy = QQTokenStrategy;
