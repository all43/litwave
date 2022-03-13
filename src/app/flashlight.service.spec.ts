import { TestBed } from '@angular/core/testing';

import { FlashlightService } from './flashlight.service';

describe('FlashlightService', () => {
  let service: FlashlightService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlashlightService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
