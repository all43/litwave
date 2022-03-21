import { Component, OnInit } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
declare const __NPM_PACKAGE_VERSION__: string; // defined in custom-webpack.config.js

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
})

export class AboutPage implements OnInit {
  version = __NPM_PACKAGE_VERSION__;
  constructor() { }

  ngOnInit() {
  }

}
