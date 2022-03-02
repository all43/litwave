import { Component, OnInit } from '@angular/core';
import { MessageService } from '../message.service';

@Component({
  selector: 'app-signal',
  templateUrl: './signal.component.html',
  styleUrls: ['./signal.component.scss'],
})
export class SignalComponent implements OnInit {
  state: boolean;

  constructor(private messageService: MessageService) { }

  ngOnInit() {
    this.messageService.stream.subscribe((state) => {
      console.log(state);
      this.state = state;
    });
  }
}
