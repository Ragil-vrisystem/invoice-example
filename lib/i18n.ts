/**
 * Minimal, dependency-free i18n layer (English + Japanese, English default).
 *
 * Language resolution mirrors the existing fixture-resolution pattern:
 * `?lang=en|ja` query param (always wins, sets a `sim_lang` cookie) ->
 * `sim_lang` cookie (sticky across navigation) -> `DEFAULT_LANG` ("en").
 * proxy.ts resolves this once per request and stamps it as an
 * `x-sim-lang` request header (readable via `headers()` in server
 * components) exactly like `x-sim-fixture` / `x-sim-pattern-type`.
 */

export type Lang = "en" | "ja";

export const DEFAULT_LANG: Lang = "en";

export function isLang(v: string | null | undefined): v is Lang {
  return v === "en" || v === "ja";
}

export function resolveLang(queryLang: string | null, cookieLang: string | null): Lang {
  if (isLang(queryLang)) return queryLang;
  if (isLang(cookieLang)) return cookieLang;
  return DEFAULT_LANG;
}

export interface Dictionary {
  common: {
    fixtureLabel: string;
    downloadInvoice: string;
    networkError: string;
    langEn: string;
    langJa: string;
    issuerName: string;
  };
  index: {
    title: string;
    intro: string;
    fixturesHeading: string;
    inputInfoLabel: string;
    localTestHeading: string;
    browserHint: string;
    curlHint: string;
    headerHint: string;
  };
  direct: {
    heading: string;
    expiredTitle: string;
    expiredBody: string;
    issuer: string;
    invoiceNumber: string;
    amount: string;
    deadline: string;
    preparingButton: string;
    downloadInvoiceNamed: (invNo: string) => string;
  };
  emailGated: {
    heading: string;
    emailLabel: string;
    verify: string;
    verifying: string;
    errorRefused: string;
    errorInvalidEmail: string;
    linkSentTitle: string;
    dryRunNote: string;
  };
  login: {
    heading: string;
    usernameLabel: string;
    passwordLabel: string;
    login: string;
    loggingIn: string;
    errorRefused: string;
    errorInvalidCredentials: string;
    sessionExpired: string;
    invoiceHistory: string;
    download: string;
  };
  loginPw: {
    heading: string;
    passwordLabel: string;
    open: string;
    checking: string;
    errorLocked: string;
    errorRefused: string;
    errorInvalidPassword: string;
    fileList: string;
    download: string;
  };
  emailOtp: {
    heading: string;
    sending: string;
    codeSentTitle: string;
    dryRunNote: string;
    sentTo: string;
    codeLabel: string;
    verify: string;
    verifying: string;
    resend: string;
    errorLocked: string;
    errorExpired: string;
    errorRefused: string;
    errorWrongCode: string;
    errorCooldown: string;
    errorSendFailed: string;
    verifiedTitle: string;
  };
  emailOtpTrigger: {
    heading: string;
    intro: string;
    sendCode: string;
    sending: string;
  };
  popup: {
    defaultMessage: string;
    closedCount: (n: number) => string;
    close: string;
    cookieMessage: string;
    securityMessage: string;
  };
  obstruct: {
    cookieBannerMessage: string;
    cookieAccept: string;
    toastMessage: string;
    toastStickyMessage: string;
    toastStickyClose: string;
    chatWidgetTitle: string;
    chatWidgetClose: string;
    stickyHeaderTitle: string;
    spinnerMessage: string;
    delayedModalMessage: string;
    delayedModalClose: string;
    alertMessage: string;
    promptMessage: string;
    confirmMessage: string;
  };
  tokenPage: {
    invalidTitle: string;
    invalidBody: string;
    expiredTitle: string;
    expiredBody: string;
    readyTitle: string;
  };
}

const en: Dictionary = {
  common: {
    fixtureLabel: "fixture:",
    downloadInvoice: "Download invoice",
    networkError: "A network error occurred.",
    langEn: "EN",
    langJa: "日本語",
    issuerName: "Sample Corp. (株式会社サンプル)",
  },
  index: {
    title: "Invoice Platform Example",
    intro:
      "A test fixture suite simulating 8 Japanese invoice-delivery platform patterns. Which pattern is shown is switched by the Host header (or the ?__host= query parameter). Every username, password, and verification code shown on each fixture is dummy test data (not a real account) — feel free to enter it as-is.",
    fixturesHeading: "Fixture list",
    inputInfoLabel: "Input info: ",
    localTestHeading: "Local testing",
    browserHint: "Browser: append a query like http://localhost:3000/?__host=inv2-direct.",
    curlHint: "curl:",
    headerHint: "Every response carries x-sim-fixture / x-sim-pattern-type headers.",
  },
  direct: {
    heading: "Invoice Notice",
    expiredTitle: "This invoice has expired",
    expiredBody: "The download deadline has passed, so this invoice is no longer available.",
    issuer: "Issuer",
    invoiceNumber: "Invoice number",
    amount: "Amount",
    deadline: "Download deadline",
    preparingButton: "Preparing the button…",
    downloadInvoiceNamed: (invNo: string) => `Download invoice (${invNo})`,
  },
  emailGated: {
    heading: "Email verification is required to view the invoice",
    emailLabel: "Email address",
    verify: "Verify",
    verifying: "Verifying…",
    errorRefused: "Access is not allowed for this email address.",
    errorInvalidEmail: "The email address format is invalid.",
    linkSentTitle: "The link has been sent by email",
    dryRunNote: "[DRY-RUN: no real email is sent. The link is shown here for testing.]",
  },
  login: {
    heading: "Invoice Portal Login",
    usernameLabel: "Username (email)",
    passwordLabel: "Password",
    login: "Log in",
    loggingIn: "Logging in…",
    errorRefused: "This account was denied access.",
    errorInvalidCredentials: "The username or password is incorrect.",
    sessionExpired: "Your session has expired. Please log in again.",
    invoiceHistory: "Invoice history",
    download: "Download",
  },
  loginPw: {
    heading: "Invoice Download (Password Authentication)",
    passwordLabel: "Password",
    open: "Open",
    checking: "Checking…",
    errorLocked: "Locked out after reaching the maximum number of password attempts.",
    errorRefused: "Access was denied for this password.",
    errorInvalidPassword: "Incorrect password.",
    fileList: "File list",
    download: "Download",
  },
  emailOtp: {
    heading: "Secure File Transfer",
    sending: "Sending the code…",
    codeSentTitle: "The verification code has been sent by email",
    dryRunNote: "[DRY-RUN: no real email is sent. Fixed test code: 424242]",
    sentTo: "Sent to:",
    codeLabel: "Verification code",
    verify: "Verify",
    verifying: "Verifying…",
    resend: "Resend code",
    errorLocked: "Locked out after reaching the maximum number of attempts.",
    errorExpired: "The verification code has expired.",
    errorRefused: "Access was denied for this code.",
    errorWrongCode: "Incorrect verification code.",
    errorCooldown: "Please wait a bit before resending.",
    errorSendFailed: "Failed to send the code.",
    verifiedTitle: "Authentication successful",
  },
  emailOtpTrigger: {
    heading: "Secure File Transfer",
    intro: "A verification code will be sent to your registered email address.",
    sendCode: "Send verification code",
    sending: "Sending…",
  },
  popup: {
    defaultMessage: "An ad is being shown",
    closedCount: (n: number) => ` (closed ${n} time${n === 1 ? "" : "s"})`,
    close: "Close",
    cookieMessage: "This site uses cookies",
    securityMessage: "Security verification required",
  },
  obstruct: {
    cookieBannerMessage: "This site uses cookies to improve your experience.",
    cookieAccept: "Accept",
    toastMessage: "Your session was refreshed.",
    toastStickyMessage: "New updates are available.",
    toastStickyClose: "Dismiss",
    chatWidgetTitle: "Chat with us",
    chatWidgetClose: "Close chat",
    stickyHeaderTitle: "Example Portal",
    spinnerMessage: "Loading…",
    delayedModalMessage: "A security check is required.",
    delayedModalClose: "Close",
    alertMessage: "This is a simulated alert dialog.",
    promptMessage: "Please enter a value:",
    confirmMessage: "Are you sure you want to continue?",
  },
  tokenPage: {
    invalidTitle: "Invalid link",
    invalidBody: "This link is not a valid invoice link.",
    expiredTitle: "This invoice has expired",
    expiredBody: "The one-time link has expired. Please verify your email address again.",
    readyTitle: "Your invoice is ready",
  },
};

const ja: Dictionary = {
  common: {
    fixtureLabel: "fixture:",
    downloadInvoice: "請求書をダウンロード",
    networkError: "通信エラーが発生しました。",
    langEn: "EN",
    langJa: "日本語",
    issuerName: "株式会社サンプル",
  },
  index: {
    title: "Invoice Platform Example",
    intro:
      "日本の請求書配信プラットフォーム8パターンを模したテスト用フィクスチャ集です。Host ヘッダー（または ?__host= クエリパラメータ）でどのパターンを表示するか切り替わります。各フィクスチャに表示されているユーザー名・パスワード・認証コードはすべてダミーのテスト用データです（実在のアカウント情報ではありません）。安心してそのまま入力してください。",
    fixturesHeading: "フィクスチャ一覧",
    inputInfoLabel: "入力情報：",
    localTestHeading: "ローカルテスト方法",
    browserHint: "ブラウザ： http://localhost:3000/?__host=inv2-direct のようにクエリを付けてアクセス。",
    curlHint: "curl：",
    headerHint: "すべてのレスポンスに x-sim-fixture / x-sim-pattern-type ヘッダーが付与されます。",
  },
  direct: {
    heading: "請求書のご案内",
    expiredTitle: "この請求書は期限切れです",
    expiredBody: "ダウンロード期限を過ぎたため、この請求書はご覧いただけません。",
    issuer: "発行元",
    invoiceNumber: "請求書番号",
    amount: "金額",
    deadline: "ダウンロード期限",
    preparingButton: "ボタンを準備しています…",
    downloadInvoiceNamed: (invNo: string) => `請求書をダウンロード（${invNo}）`,
  },
  emailGated: {
    heading: "請求書の閲覧にはメールアドレスの確認が必要です",
    emailLabel: "メールアドレス",
    verify: "確認する",
    verifying: "確認中…",
    errorRefused: "このメールアドレスではアクセスできません。",
    errorInvalidEmail: "メールアドレスの形式が正しくありません。",
    linkSentTitle: "リンクをメールで送信しました",
    dryRunNote: "[DRY-RUN：実際のメール送信は行われません。テスト用にリンクをここに表示しています]",
  },
  login: {
    heading: "請求書ポータル ログイン",
    usernameLabel: "ユーザー名（メールアドレス）",
    passwordLabel: "パスワード",
    login: "ログイン",
    loggingIn: "ログイン中…",
    errorRefused: "このアカウントはアクセスが拒否されました。",
    errorInvalidCredentials: "ユーザー名またはパスワードが正しくありません。",
    sessionExpired: "セッションの有効期限が切れました。再度ログインしてください。",
    invoiceHistory: "請求履歴",
    download: "ダウンロード",
  },
  loginPw: {
    heading: "請求書ダウンロード（パスワード認証）",
    passwordLabel: "パスワード",
    open: "開く",
    checking: "確認中…",
    errorLocked: "パスワードの試行回数が上限に達したため、ロックされました。",
    errorRefused: "このパスワードではアクセスが拒否されました。",
    errorInvalidPassword: "パスワードが正しくありません。",
    fileList: "ファイル一覧",
    download: "ダウンロード",
  },
  emailOtp: {
    heading: "セキュアファイル転送",
    sending: "コードを送信しています…",
    codeSentTitle: "認証コードをメールで送信しました",
    dryRunNote: "[DRY-RUN：実際のメール送信は行われません。テスト用固定コード: 424242]",
    sentTo: "送信先：",
    codeLabel: "認証コード",
    verify: "確認する",
    verifying: "確認中…",
    resend: "コードを再送信",
    errorLocked: "認証コードの試行回数が上限に達したため、ロックされました。",
    errorExpired: "認証コードの有効期限が切れています。",
    errorRefused: "このコードではアクセスが拒否されました。",
    errorWrongCode: "認証コードが正しくありません。",
    errorCooldown: "再送信は少し時間をおいてからお試しください。",
    errorSendFailed: "コードの送信に失敗しました。",
    verifiedTitle: "認証に成功しました",
  },
  emailOtpTrigger: {
    heading: "セキュアファイル転送",
    intro: "登録済みのメールアドレス宛に認証コードを送信します。",
    sendCode: "認証コードを送信",
    sending: "送信中…",
  },
  popup: {
    defaultMessage: "広告が表示されています",
    closedCount: (n: number) => `（${n}回閉じました）`,
    close: "閉じる",
    cookieMessage: "このサイトはCookieを使用しています",
    securityMessage: "セキュリティ確認が必要です",
  },
  obstruct: {
    cookieBannerMessage: "このサイトはCookieを使用して体験を向上させています。",
    cookieAccept: "同意する",
    toastMessage: "セッションを更新しました。",
    toastStickyMessage: "新しい更新があります。",
    toastStickyClose: "閉じる",
    chatWidgetTitle: "チャットでお問い合わせ",
    chatWidgetClose: "チャットを閉じる",
    stickyHeaderTitle: "サンプルポータル",
    spinnerMessage: "読み込み中…",
    delayedModalMessage: "セキュリティチェックが必要です。",
    delayedModalClose: "閉じる",
    alertMessage: "これはシミュレートされたアラートダイアログです。",
    promptMessage: "値を入力してください：",
    confirmMessage: "続行してもよろしいですか？",
  },
  tokenPage: {
    invalidTitle: "無効なリンクです",
    invalidBody: "このリンクは有効な請求書リンクではありません。",
    expiredTitle: "この請求書は期限切れです",
    expiredBody: "ワンタイムリンクの有効期限が切れています。再度メールアドレスをご確認ください。",
    readyTitle: "請求書の準備ができました",
  },
};

export function t(lang: Lang): Dictionary {
  return lang === "ja" ? ja : en;
}

/** Locale-aware month-end label, e.g. "end of Sep 2026" / "2026年09月末日". */
export function formatEndOfMonth(year: number, month1To12: number, lang: Lang): string {
  if (lang === "ja") {
    return `${year}年${String(month1To12).padStart(2, "0")}月末日`;
  }
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `end of ${monthNames[month1To12 - 1]} ${year}`;
}

/** Locale-aware "YYYYMM分" / "Month YYYY" label for a YYYYMM string. */
export function formatMonthLabel(ym: string, lang: Lang): string {
  const year = Number(ym.slice(0, 4));
  const month1To12 = Number(ym.slice(4, 6));
  if (lang === "ja") {
    return `${year}年${String(month1To12).padStart(2, "0")}月分`;
  }
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${monthNames[month1To12 - 1]} ${year}`;
}

export function formatYen(amount: number, lang: Lang): string {
  return `¥${amount.toLocaleString(lang === "ja" ? "ja-JP" : "en-US")}`;
}
