// src/scripts/mobile-optimization.js
// Mobile optimization utilities for JasaWeb PWA

class MobileOptimizer {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isTouch = 'ontouchstart' in window;
    this.init();
  }

  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(userAgent) || window.innerWidth <= 768;
  }

  init() {
    if (this.isMobile) {
      this.setupViewportOptimization();
      this.setupTouchOptimizations();
      this.setupPerformanceOptimizations();
      this.setupPWAFeatures();
      this.setupNetworkOptimizations();
    }
  }

  setupViewportOptimization() {
    // Prevent zoom on input focus (common mobile issue)
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      input.addEventListener('focus', () => {
        document
          .querySelector('meta[name="viewport"]')
          .setAttribute(
            'content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
          );
      });

      input.addEventListener('blur', () => {
        document
          .querySelector('meta[name="viewport"]')
          .setAttribute(
            'content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
          );
      });
    });

    // Handle safe area insets for modern mobile devices
    this.setupSafeAreaInsets();
  }

  setupSafeAreaInsets() {
    const root = document.documentElement;

    // Get safe area insets
    const style = getComputedStyle(document.body);
    const safeAreaTop =
      style.getPropertyValue('env(safe-area-inset-top)') || '0px';
    const safeAreaBottom =
      style.getPropertyValue('env(safe-area-inset-bottom)') || '0px';

    root.style.setProperty('--safe-area-top', safeAreaTop);
    root.style.setProperty('--safe-area-bottom', safeAreaBottom);
  }

  setupTouchOptimizations() {
    // Add touch feedback to interactive elements
    const touchElements = document.querySelectorAll('button, a, .clickable');
    touchElements.forEach((element) => {
      element.addEventListener('touchstart', () => {
        element.style.transform = 'scale(0.98)';
        element.style.transition = 'transform 0.1s';
      });

      element.addEventListener('touchend', () => {
        element.style.transform = 'scale(1)';
      });
    });

    // Setup swipe gestures
    this.setupSwipeGestures();

    // Setup pull-to-refresh
    this.setupPullToRefresh();
  }

  setupSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      },
      { passive: true }
    );

    document.addEventListener(
      'touchend',
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        this.handleSwipeGesture(touchStartX, touchStartY, touchEndX, touchEndY);
      },
      { passive: true }
    );
  }

  handleSwipeGesture(startX, startY, endX, endY) {
    const swipeThreshold = 50;
    const diffX = startX - endX;
    const diffY = startY - endY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) {
          this.onSwipeLeft();
        } else {
          this.onSwipeRight();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > swipeThreshold) {
        if (diffY > 0) {
          this.onSwipeUp();
        } else {
          this.onSwipeDown();
        }
      }
    }
  }

  onSwipeLeft() {
    // Navigate to next page or show next item
    console.log('Swipe left detected');
  }

  onSwipeRight() {
    // Navigate to previous page or go back
    console.log('Swipe right detected');
    if (window.history.length > 1) {
      window.history.back();
    }
  }

  onSwipeUp() {
    // Could be used for refreshing or showing more content
    console.log('Swipe up detected');
  }

  onSwipeDown() {
    // Could trigger pull-to-refresh
    console.log('Swipe down detected');
  }

  setupPullToRefresh() {
    let startY = 0;
    let isPulling = false;
    const pullThreshold = 80;

    document.addEventListener(
      'touchstart',
      (e) => {
        if (window.scrollY === 0) {
          startY = e.touches[0].pageY;
          isPulling = true;
        }
      },
      { passive: true }
    );

    document.addEventListener('touchmove', (e) => {
      if (!isPulling) return;

      const currentY = e.touches[0].pageY;
      const diff = currentY - startY;

      if (diff > 0 && diff < pullThreshold * 2) {
        e.preventDefault();
        this.showPullIndicator(diff);
      }
    });

    document.addEventListener(
      'touchend',
      (e) => {
        if (!isPulling) return;

        const currentY = e.changedTouches[0].pageY;
        const diff = currentY - startY;

        if (diff > pullThreshold) {
          this.triggerRefresh();
        } else {
          this.hidePullIndicator();
        }

        isPulling = false;
      },
      { passive: true }
    );
  }

  showPullIndicator(pullDistance) {
    let indicator = document.getElementById('pullToRefreshIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'pullToRefreshIndicator';
      indicator.className =
        'fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 z-50 transition-transform';
      indicator.innerHTML =
        '<i class="fas fa-arrow-down mr-2"></i>Pull to refresh';
      document.body.appendChild(indicator);
    }

    const opacity = Math.min(pullDistance / 80, 1);
    indicator.style.transform = `translateY(${Math.min(pullDistance, 80)}px)`;
    indicator.style.opacity = opacity;
  }

  hidePullIndicator() {
    const indicator = document.getElementById('pullToRefreshIndicator');
    if (indicator) {
      indicator.style.transform = 'translateY(-100%)';
      setTimeout(() => indicator.remove(), 300);
    }
  }

  triggerRefresh() {
    this.hidePullIndicator();
    window.location.reload();
  }

  setupPerformanceOptimizations() {
    // Lazy load images
    this.lazyLoadImages();

    // Optimize scrolling performance
    this.optimizeScrolling();

    // Reduce motion on low-end devices
    this.reduceMotion();
  }

  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }

  optimizeScrolling() {
    let scrollTimeout;
    window.addEventListener(
      'scroll',
      () => {
        if (scrollTimeout) {
          window.cancelAnimationFrame(scrollTimeout);
        }

        scrollTimeout = window.requestAnimationFrame(() => {
          // Handle scroll-based optimizations
          this.updateScrollPosition();
        });
      },
      { passive: true }
    );
  }

  updateScrollPosition() {
    // Update any scroll-based UI elements
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Show/hide scroll-to-top button
    const scrollButton = document.getElementById('scrollTopButton');
    if (scrollButton) {
      if (scrollTop > 300) {
        scrollButton.classList.add('show');
      } else {
        scrollButton.classList.remove('show');
      }
    }
  }

  reduceMotion() {
    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty(
        '--animation-duration',
        '0.01ms'
      );
      document.documentElement.style.setProperty(
        '--transition-duration',
        '0.01ms'
      );
    }
  }

  setupPWAFeatures() {
    // Setup install prompt
    this.setupInstallPrompt();

    // Setup push notifications
    this.setupPushNotifications();

    // Setup background sync
    this.setupBackgroundSync();
  }

  setupInstallPrompt() {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show custom install prompt after delay
      setTimeout(() => {
        this.showInstallPrompt(deferredPrompt);
      }, 5000);
    });
  }

  showInstallPrompt(prompt) {
    // Custom install prompt logic
    const installBanner = document.createElement('div');
    installBanner.className =
      'fixed bottom-20 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50';
    installBanner.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Install JasaWeb App</p>
          <p class="text-sm opacity-90">Get the full experience</p>
        </div>
        <div class="flex gap-2">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="px-3 py-1 bg-white bg-opacity-20 rounded">Not now</button>
          <button onclick="mobileOptimizer.installApp()" class="px-3 py-1 bg-white text-blue-600 rounded font-medium">Install</button>
        </div>
      </div>
    `;

    document.body.appendChild(installBanner);

    // Store prompt for later use
    this.deferredPrompt = prompt;
  }

  installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        this.deferredPrompt = null;
      });
    }

    // Remove install banner
    const banner = document.querySelector('.fixed.bottom-20');
    if (banner) banner.remove();
  }

  setupPushNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Request permission and subscribe to push notifications
      this.requestNotificationPermission();
    }
  }

  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        // Subscribe to push notifications
        this.subscribeToPushNotifications();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  async subscribeToPushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'your-public-key-here'
        ),
      });

      console.log('Push notification subscription:', subscription);
      // Send subscription to server
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  setupBackgroundSync() {
    if (
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      // Register background sync
      this.registerBackgroundSync();
    }
  }

  registerBackgroundSync() {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.sync.register('background-sync');
      })
      .then(() => {
        console.log('Background sync registered');
      })
      .catch((error) => {
        console.error('Error registering background sync:', error);
      });
  }

  setupNetworkOptimizations() {
    // Monitor network status
    this.monitorNetworkStatus();

    // Setup offline indicators
    this.setupOfflineIndicator();

    // Optimize for slow networks
    this.optimizeForSlowNetworks();
  }

  monitorNetworkStatus() {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;

      if (isOnline) {
        this.showNetworkStatus('Online', 'success');
        // Sync any pending data
        this.syncPendingData();
      } else {
        this.showNetworkStatus('Offline', 'error');
      }

      // Update UI based on connection quality
      if (connection) {
        this.updateUIForConnection(connection);
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateNetworkStatus);
    }
  }

  showNetworkStatus(message, type) {
    const status = document.getElementById('networkStatus');
    if (status) {
      status.textContent = message;
      status.className = `fixed top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`;

      setTimeout(() => {
        status.className = 'hidden';
      }, 3000);
    }
  }

  updateUIForConnection(connection) {
    const isSlow =
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g';

    if (isSlow) {
      // Reduce data usage on slow connections
      document.documentElement.classList.add('slow-connection');
      this.disableAutoPlay();
      this.reduceImageQuality();
    } else {
      document.documentElement.classList.remove('slow-connection');
    }
  }

  disableAutoPlay() {
    const videos = document.querySelectorAll('video[autoplay]');
    videos.forEach((video) => {
      video.autoplay = false;
      video.controls = true;
    });
  }

  reduceImageQuality() {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (img.dataset.lowSrc) {
        img.src = img.dataset.lowSrc;
      }
    });
  }

  setupOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'networkStatus';
    indicator.className =
      'hidden fixed top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white text-sm font-medium z-50';
    document.body.appendChild(indicator);
  }

  optimizeForSlowNetworks() {
    // Add CSS for slow connections
    const style = document.createElement('style');
    style.textContent = `
      .slow-connection img {
        filter: blur(2px);
        image-rendering: optimizeSpeed;
      }
      
      .slow-connection video {
        display: none;
      }
      
      .slow-connection .animation {
        animation: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  async syncPendingData() {
    // Sync any pending offline actions
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.sync.register('sync-pending-data');
    }
  }
}

// Initialize mobile optimizer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.mobileOptimizer = new MobileOptimizer();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileOptimizer;
}
