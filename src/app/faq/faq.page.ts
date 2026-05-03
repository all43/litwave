import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface FaqItem {
  q: string;
  a: string;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.page.html',
  styleUrls: ['./faq.page.scss'],
  standalone: false,
})
export class FaqPage implements OnInit {
  faqItems: FaqItem[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<FaqItem[]>('assets/faq.json').subscribe(items => {
      this.faqItems = items;
    });
  }
}
