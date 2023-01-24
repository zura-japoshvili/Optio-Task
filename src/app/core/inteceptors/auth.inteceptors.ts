import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {environment} from "../../../environments/environment";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth_token = environment.auth_token;
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone the request and add the new headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(this.auth_token)}`
    };
    const authReq = req.clone({ setHeaders: headers });
    // Pass on the cloned request instead of the original request.
    return next.handle(authReq);
  }
}
