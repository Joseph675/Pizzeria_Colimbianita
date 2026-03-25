import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CaseTransformInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Transformar camelCase a snake_case para las requests (si es POST/PUT)
    let modifiedReq = req;
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const originalBody = req.body;
      const transformedBody = this.camelToSnake(req.body);
      console.log(`[${req.method}] ${req.url} - Original body:`, originalBody);
      console.log(`[${req.method}] ${req.url} - Transformed body:`, transformedBody);
      modifiedReq = req.clone({
        body: transformedBody
      });
    }

    return next.handle(modifiedReq).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // Transformar snake_case a camelCase para las responses
          const originalBody = event.body;
          const transformedBody = this.snakeToCamel(event.body);
          console.log(`[RESPONSE] ${event.url} - Original body:`, originalBody);
          console.log(`[RESPONSE] ${event.url} - Transformed body:`, transformedBody);
          event = event.clone({
            body: transformedBody
          });
        }
        return event;
      })
    );
  }

  private camelToSnake(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.camelToSnake(item));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((result, key) => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = this.camelToSnake(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  }

  private snakeToCamel(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.snakeToCamel(item));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = this.snakeToCamel(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  }
}
