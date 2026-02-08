import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 密码登录接口参数 */
  export interface PwdSigninParams {
    email: string;
    password: string;
  }

  /** 邮箱验证码登录接口参数 */
  export interface CodeSigninParams {
    email: string;
    code: string;
  }

  /** 注册接口参数 */
  export interface SignupParams {
    code: string;
    email: string;
    password: string;
    confirmPassword: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    tokenName: string;
  }

  /** 发送验证码接口参数 */
  export interface SendCodeParams {
    email: string;
    type: 'LOGIN' | 'REGISTER' | 'RESET' | 'VERIFY_EMAIL';
  }
}

/**
 * 发送验证码
 */
export async function sendCodeApi(data: AuthApi.SendCodeParams) {
  return requestClient.post('/auth/send_code', data);
}

/**
 * 密码登录
 */
export async function pwdSignInApi(data: AuthApi.PwdSigninParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/pwd_signin', data);
}

/**
 * 邮箱验证码登录
 */
export async function codeSignInApi(data: AuthApi.CodeSigninParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/code_signin', data);
}

/**
 * 注册
 */
export async function signupApi(data: AuthApi.SignupParams) {
  return requestClient.post('/auth/code_signup', data);
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.get('/auth/signout');
}
