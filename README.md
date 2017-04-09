>Fork form passport-qq2015  



# passport-qq2015-fix
QQ第三方授权登录,使用与web网站，可在express和koa等框架中使用。
代码用到了`Object.assign()`,需要在 **es6** 的环境中使用。

## Install

```
$ npm install passport-qq2015-fix
```

## 项目文件结构
整个项目采用MVC架构，基本项目结构如下图
```asciidoc
passport-qq2015-fix/             项目根目录
├── lib/                     核心代码           
├── package.json			 npm的声明文件，包含项目的依赖等
└── README.md				包含对此此项目的一些介绍，就是当前说看到的内容
```




## Usage
### 配置strategy

```javascript

  passport.use('qq-token', new qqStrategy({
    clientID: config.qq.appID,
    clientSecret: config.qq.appKEY,
    callbackURL: 'http://www.xxxx.com/auth/token/qq/callback'
    passReqToCallback: true //不需要的话可以设置成 false
  },
    function (req,accessToken, refreshToken, profile, done) {
      //function (accessToken, refreshToken, profile, done) 如果你设置为false后请使用这个方法
      if (!profile) {
        return done(null, false);
      }else{
          profile = JSON.parse(profile); //解析profile
          if(profile.ret = -1){
              return done(null, false); //api给你返回了错误，捕获
          }
          return done(null, profile);
      }
  ));
```

### 授权请求
包含两个api接口。第一个请求负责跳转到授权页面，第二个请求是qq授权的回调地址，根据获得的code，依次获得accessToKen, openId, userInfo，并最终跳转到指定的地址。


example如下:

```javascript

  router.get('/token/qq', passport.authenticate('qq-token', {
    session: false
  }));

  router.get('/token/qq/callback',
    passport.authenticate('qq-token', {
      session: false,
      failureRedirect: 'http://www.fail.com'
    }),
    function *() {
      const res = this.response;
      res.redirect('http://success.com');
    });
```
