import { Component } from '@angular/core';

@Component({
  selector: 'toast-sample-iconmio',
  template: `<svg
    class="rounded me-2"
    width="20"
    height="20"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
    focusable="false"
    role="img"
  >
    <rect width="100%" height="100%" fill="rgb(0, 255, 0)"></rect>
  </svg>`,
  standalone: true
})
export class ToastSampleIconComponent {}
