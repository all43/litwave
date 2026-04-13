import { Observable, Subscriber } from 'rxjs';

export interface BackgroundAdapter {
  foreground$: Observable<boolean>;
}

export function createWebBackgroundAdapter(): BackgroundAdapter {
  return {
    foreground$: new Observable((subscriber: Subscriber<boolean>) => {
      const handler = () => {
        subscriber.next(document.visibilityState === 'visible');
      };
      document.addEventListener('visibilitychange', handler);
      return () => document.removeEventListener('visibilitychange', handler);
    }),
  };
}
