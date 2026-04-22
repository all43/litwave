import { Component, OnInit } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
declare const __NPM_PACKAGE_VERSION__: string;

@Component({
  selector: 'app-info',
  templateUrl: './info.page.html',
  styleUrls: ['./info.page.scss'],
  standalone: false,
})
export class InfoPage implements OnInit {
  version = __NPM_PACKAGE_VERSION__;

  constructor() { }

  ngOnInit() {
  }

}
