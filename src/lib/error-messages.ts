export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_AMOUNT: "مبلغ واردشده معتبر نیست و باید بزرگ‌تر از صفر باشد.",
  INVALID_WEIGHT: "وزن واردشده معتبر نیست و باید بزرگ‌تر از صفر باشد.",
  INSUFFICIENT_CASH_BALANCE: "موجودی نقدی شما برای این خرید کافی نیست.",
  INSUFFICIENT_SILVER_BALANCE: "موجودی نقره شما برای این فروش کافی نیست.",
  INSUFFICIENT_MARKET_SILVER: "موجودی نقره بازار برای این خرید کافی نیست.",
  PRICE_UNAVAILABLE: "قیمت نقره در حال حاضر در دسترس نیست. لطفاً دوباره تلاش کنید.",
  TRANSACTION_NOT_FOUND: "معامله مورد نظر پیدا نشد.",
  ORDER_NOT_FOUND: "سفارش مورد نظر پیدا نشد.",
  INVALID_IDEMPOTENCY_KEY: "کلید درخواست نامعتبر است. لطفاً دوباره تلاش کنید.",
  DUPLICATE_REQUEST: "این درخواست قبلاً ثبت شده است.",
  IDEMPOTENCY_KEY_REUSED: "این درخواست با مقادیر متفاوت قبلاً ثبت شده است.",
  VALIDATION_ERROR: "اطلاعات واردشده معتبر نیست.",
  NOT_FOUND: "مورد درخواستی پیدا نشد.",
  INTERNAL_SERVER_ERROR: "خطایی در سرور رخ داده است. لطفاً دوباره تلاش کنید.",
};

export function messageForErrorCode(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
}
