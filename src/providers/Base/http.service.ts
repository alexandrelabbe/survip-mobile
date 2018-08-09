import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {TranslateService} from "@ngx-translate/core";
import {Events} from 'ionic-angular';
import {catchError} from 'rxjs/operators';

@Injectable()
export class HttpService {
  //private apiUrl = 'https://survipreventiontest.cauca.ca/api/';
  private apiUrl = 'http://10.10.33.101:5555/api/';

  constructor(
    private client: HttpClient,
    private translateService: TranslateService,
    private events: Events) {
  }

  private getHeaders() {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + sessionStorage.getItem('currentToken'),
        'languageCode': this.translateService.getDefaultLang()
      })
    };
    return options;
  }

  public get(url: string): Observable<any> {
    return this.client.get(this.getFullUrl(url), this.getHeaders()).pipe(
      catchError((error: HttpErrorResponse) => this.onError(error))
    );
  }

  public rawGet(url: string, retryCount: number = 3): Observable<any> {
    return this.client.get(this.getFullUrl(url), this.getHeaders())
      .retry(retryCount)
      .catch((err: HttpErrorResponse) => this.handleError(err));
  }

  public post(url: string, body?: any): Observable<any> {
    console.log('post', this.getFullUrl(url));
    return this.client
      .post(this.getFullUrl(url), body, this.getHeaders()).pipe(
        catchError((error: HttpErrorResponse) => this.onError(error))
      );
  }

  public rawPost(url: string, body?: any): Observable<any> {
    console.log('post', this.getFullUrl(url));
    return this.client
      .post(this.getFullUrl(url), body, this.getHeaders())
      .catch((err: HttpErrorResponse) => this.handleError(err));
  }

  public put(url: string, body?: any): Observable<any> {
    console.log('post', this.getFullUrl(url));
    return this.client.post(this.getFullUrl(url), body, this.getHeaders()).pipe(
      catchError((error: HttpErrorResponse) => this.onError(error))
    );
  }

  public delete(url: string): Observable<any> {
    return this.client.delete(this.getFullUrl(url), this.getHeaders()).pipe(
      catchError((error: HttpErrorResponse) => this.onError(error))
    );
  }

  private getFullUrl(url: string): string {
    if (!this.apiUrl) {
      throw new Error('You need to set "apiUrl" inside your "cause" configuration.');
    }
    return this.apiUrl + url;
  }

  private onError(error: HttpErrorResponse) {
    let message = '';

    switch (error.status) {
      case 0:
        message = this.translateService.instant('requestTimeout');
        break;
      case 400:
        message = this.translateService.instant(error.error);
        break;
      case 401:
        //this.refresh();
        console.log("401 in http.service");
        break;
      case 404:
        message = this.translateService.instant('requestServer404', {url: error.url});
        break;
      case 500:
        message = this.translateService.instant('requestServer500');
        break;
    }

    if (message) {
      this.events.publish("http:error", message);
    }
    console.log(message);
    return Observable.throw(error);
  }

  /*private refresh() {
    this.client.post(this.apiUrl + 'Authentification/Refresh', {
      accessToken: sessionStorage.getItem('currentToken'),
      refreshToken: sessionStorage.getItem('refreshToken'),
    }).subscribe(
      response => this.onRefresh(response),
      error => this.onLogout(error)
    );
  }

  }*/

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
      if (error.status == 0 || error.status == 401)
        console.log("shall redirect");
    }

    return Observable.of({
      'status': error.status,
      'body': error.error
    });
  }
}


