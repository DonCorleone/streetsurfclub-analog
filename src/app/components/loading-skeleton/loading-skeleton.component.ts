import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  template: `
    @if (type === 'post-card') {
    <div class="animate-pulse">
      <div class="bg-gray-300 h-[240px] w-full mb-4"></div>
      <div class="p-6">
        <div class="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
        <div class="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div class="h-4 bg-gray-300 rounded w-full mb-2"></div>
        <div class="h-4 bg-gray-300 rounded w-5/6"></div>
      </div>
    </div>
    }
    @if (type === 'banner') {
    <div class="animate-pulse">
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-[25px]">
        <div class="self-center space-y-4">
          <div class="h-6 bg-gray-300 rounded w-1/4"></div>
          <div class="h-12 bg-gray-300 rounded w-full"></div>
          <div class="h-4 bg-gray-300 rounded w-full"></div>
          <div class="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
        <div class="self-center">
          <div class="bg-gray-300 h-[400px] w-full rounded"></div>
        </div>
      </div>
    </div>
    }
    @if (type === 'post-detail') {
    <div class="animate-pulse">
      <div class="bg-gray-300 h-[400px] w-full mb-8 rounded-lg"></div>
      <div class="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
      <div class="h-12 bg-gray-300 rounded w-3/4 mb-6"></div>
      <div class="space-y-3">
        <div class="h-4 bg-gray-300 rounded w-full"></div>
        <div class="h-4 bg-gray-300 rounded w-full"></div>
        <div class="h-4 bg-gray-300 rounded w-5/6"></div>
      </div>
    </div>
    }
  `
})
export class LoadingSkeletonComponent {
  @Input() type: 'post-card' | 'banner' | 'post-detail' = 'post-card';
}
