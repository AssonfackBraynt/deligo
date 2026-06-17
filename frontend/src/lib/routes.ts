export const routes = {
  home: '/',
  requestStart: '/request',
  requestType: (draftId: string) => `/request/${draftId}/type`,
  requestRoute: (draftId: string) => `/request/${draftId}/route`,
  requestItem: (draftId: string) => `/request/${draftId}/item`,
  requestProvider: (draftId: string) => `/request/${draftId}/provider`,
  requestContact: (draftId: string) => `/request/${draftId}/contact`,
  requestReview: (draftId: string) => `/request/${draftId}/review`,
  requestPayment: (draftId: string) => `/request/${draftId}/payment`,
  requestSuccess: (draftId: string) => `/request/${draftId}/success`,
  tracking: (trackingCode: string) => `/track/${trackingCode}`,
};
