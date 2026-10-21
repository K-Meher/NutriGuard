// ============================================================
// Multi-Language Localization & Voice TTS Engine (NutriGuard)
// Supports English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali
// ============================================================

export type Language = "English" | "हिन्दी" | "తెలుగు" | "தமிழ்" | "ಕನ್ನಡ" | "മലയാളം" | "मराठी" | "বাংলা";

export const LANGUAGES: Language[] = [
  "English",
  "हिन्दी",
  "తెలుగు",
  "தமிழ்",
  "ಕನ್ನಡ",
  "മലയാളം",
  "मराठी",
  "বাংলা"
];

export const LANG_CODES: Record<Language, string> = {
  "English": "en-US",
  "हिन्दी": "hi-IN",
  "తెలుగు": "te-IN",
  "தமிழ்": "ta-IN",
  "ಕನ್ನಡ": "kn-IN",
  "മലയാളം": "ml-IN",
  "मराठी": "mr-IN",
  "বাংলা": "bn-IN"
};

export interface UiTranslations {
  // App Header & Navigation
  appName: string;
  selectLanguage: string;
  back: string;
  scanHistory: string;
  signOut: string;
  editProfile: string;

  // Welcome Screen
  welcomeHeadline: string;
  welcomeSub: string;
  getStarted: string;
  signIn: string;
  haveAccount: string;

  // Login Screen
  welcomeBack: string;
  loginSub: string;
  emailLabel: string;
  parentEmailLabel: string;
  childEmailLabel: string;
  passwordLabel: string;
  loginButton: string;
  noAccount: string;
  createOne: string;

  // Sign Up Screen
  createAccount: string;
  signupSub: string;
  fullNameLabel: string;
  accountTypeLabel: string;
  personal: string;
  parent: string;
  child: string;
  childAccount: string;
  childNameLabel: string;
  parentNameLabel: string;
  childLoginSub: string;
  childAllergensLabel: string;
  childFoodPrefLabel: string;
  sendOtp: string;

  // OTP Verification Screen
  verifyEmail: string;
  checkEmailTitle: string;
  sentOtpTo: string;
  otpSentDesc: string;
  verifyButton: string;
  resendOtp: string;
  resendIn: string;
  skipForNow: string;

  // Profile Screen
  profileTitle: string;
  profileSub: string;
  dietaryPreferences: string;
  allergens: string;
  saveProfile: string;
  saving: string;
  profileSaved: string;

  // Scanner Screen
  scannerTitle: string;
  scannerSub: string;
  uploadImage: string;
  useCamera: string;
  takePhoto: string;
  capturePhoto: string;
  cancel: string;
  changeImage: string;
  analyzeButton: string;
  analyzing: string;

  // Results Screen
  analysisResult: string;
  scanDate: string;
  status: string;
  successStatus: string;
  partialStatus: string;
  readAloud: string;
  summaryTitle: string;
  identifiedIngredients: string;
  unrecognizedText: string;
  technologicalFunction: string;
  officialStandard: string;
  evidenceSummary: string;
  sourceOrg: string;
  viewOfficialSource: string;
  informationNotAvailable: string;
  scanAnother: string;

  // Safety Score & Modern Scan Experience
  safetyScoreTitle: string;
  interpretationLabel: string;
  keyFindings: string;
  identifiedCountLabel: string;
  attentionCountLabel: string;
  cleanCountLabel: string;
  unrecognizedCountLabel: string;
  viewDetails: string;
  hideDetails: string;
  scoreExplanation: string;
  allergenAlertTitle: string;
  childAllergenAlertTitle: string;
  evidenceCoverageLabel: string;
  retakePhoto: string;
  scanIngredients: string;
  cameraGuidance: string;
  cameraPermissionDenied: string;

  // Dietary options
  veg: string;
  vegan: string;
  glutenFree: string;
  dairyFree: string;
  halal: string;
  nuts: string;
  milk: string;
  wheat: string;
  soy: string;
  eggs: string;
}

export const translations: Record<Language, UiTranslations> = {
  "English": {
    appName: "NutriGuard",
    selectLanguage: "Language",
    back: "Back",
    scanHistory: "Scan History",
    signOut: "Sign Out",
    editProfile: "Profile Settings",

    welcomeHeadline: "Know what you eat.",
    welcomeSub: "Scan ingredient lists on packaged food. Understand additives, emulsifiers, and preservatives with official scientific evidence.",
    getStarted: "Get Started",
    signIn: "Sign In",
    haveAccount: "Already have an account?",

    welcomeBack: "Welcome back",
    loginSub: "Sign in with your email and password to access your scan history.",
    emailLabel: "Email address",
    parentEmailLabel: "Parent's Email Address",
    childEmailLabel: "Child's Email Address",
    passwordLabel: "Password",
    loginButton: "Sign In",
    noAccount: "Don't have an account?",
    createOne: "Create an account",

    createAccount: "Create Account",
    signupSub: "Join NutriGuard to scan and understand packaged food ingredients.",
    fullNameLabel: "Full Name",
    accountTypeLabel: "Account Type",
    personal: "Personal",
    parent: "Parent / Family",
    child: "Child",
    childAccount: "Child Account",
    childNameLabel: "Child's Full Name",
    parentNameLabel: "Parent's Full Name",
    childLoginSub: "Log in with your child email address using an OTP",
    childAllergensLabel: "Child's Allergens",
    childFoodPrefLabel: "Child's Food Preference",
    sendOtp: "Send Verification Code",

    verifyEmail: "Email Verification",
    checkEmailTitle: "Check your email",
    sentOtpTo: "We sent a 6-digit verification code to",
    otpSentDesc: "Enter the 6-digit code received on your email. Check your spam folder if not visible.",
    verifyButton: "Verify & Continue",
    resendOtp: "Resend Code",
    resendIn: "Resend in",
    skipForNow: "Skip for now →",

    profileTitle: "Your Health Profile",
    profileSub: "Personalize safety flags and allergen warnings according to your dietary needs.",
    dietaryPreferences: "Dietary Preferences",
    allergens: "Known Allergens / Sensitivities",
    saveProfile: "Save Profile",
    saving: "Saving...",
    profileSaved: "Profile updated successfully!",

    scannerTitle: "Food Ingredient Analyzer",
    scannerSub: "Upload or take a photo of any packaged food ingredient label.",
    uploadImage: "Upload Image",
    useCamera: "Use Camera",
    takePhoto: "Take Photo",
    capturePhoto: "Capture Image",
    cancel: "Cancel",
    changeImage: "Change Image",
    analyzeButton: "Analyze Ingredients",
    analyzing: "Analyzing Ingredients...",

    analysisResult: "Ingredient Analysis",
    scanDate: "Scan Date",
    status: "Processing Status",
    successStatus: "All Identified",
    partialStatus: "Partially Identified",
    readAloud: "Listen",
    summaryTitle: "Summary & Findings",
    identifiedIngredients: "Identified Ingredients",
    unrecognizedText: "Unrecognized / General Terms",
    technologicalFunction: "Technological Function",
    officialStandard: "Official Reference Standard",
    evidenceSummary: "Scientific Evidence Summary",
    sourceOrg: "Source Organization",
    viewOfficialSource: "Official Source Link",
    informationNotAvailable: "Information not available in database",
    scanAnother: "Scan Another Product",

    safetyScoreTitle: "Safety Score",
    interpretationLabel: "Interpretation",
    keyFindings: "Key Findings",
    identifiedCountLabel: "Identified ingredients",
    attentionCountLabel: "Ingredients requiring attention",
    cleanCountLabel: "Clean / whole ingredients",
    unrecognizedCountLabel: "Unrecognized ingredients",
    viewDetails: "View Details",
    hideDetails: "Hide Details",
    scoreExplanation: "How this score was calculated",
    allergenAlertTitle: "Allergen Alert Detected",
    childAllergenAlertTitle: "Child Allergen Alert Detected",
    evidenceCoverageLabel: "Evidence Coverage",
    retakePhoto: "Retake Photo",
    scanIngredients: "Scan Ingredients",
    cameraGuidance: "Place the ingredient list inside the frame and ensure the text is clear, focused, and well lit.",
    cameraPermissionDenied: "Camera access denied or unavailable. Please enable camera permissions in your browser or upload a photo.",

    veg: "Vegetarian",
    vegan: "Vegan",
    glutenFree: "Gluten-Free",
    dairyFree: "Dairy-Free",
    halal: "Halal",
    nuts: "Tree Nuts & Peanuts",
    milk: "Milk & Dairy",
    wheat: "Wheat & Gluten",
    soy: "Soy & Soya",
    eggs: "Eggs"
  },

  "తెలుగు": {
    appName: "న్యూట్రిగార్డ్",
    selectLanguage: "భాష",
    back: "వెనుకకు",
    scanHistory: "స్కాన్ చరిత్ర",
    signOut: "లాగ్ అవుట్",
    editProfile: "ప్రొఫైల్ అమరికలు",

    welcomeHeadline: "మీరు ఏమి తింటున్నారో తెలుసుకోండి.",
    welcomeSub: "ప్యాక్ చేసిన ఆహార లేబుల్స్‌ను స్కాన్ చేయండి. రసాయనాలు, సంరక్షణకారులు మరియు రంగుల గురించి అధికారిక సమాచారం పొందండి.",
    getStarted: "ప్రారంభించండి",
    signIn: "లాగిన్ అవ్వండి",
    haveAccount: "ఇప్పటికే ఖాతా ఉందా?",

    welcomeBack: "స్వాగతం",
    loginSub: "మీ మునుపటి స్కాన్ వివరాలను చూడటానికి మీ ఈమెయిల్ తో లాగిన్ అవ్వండి.",
    emailLabel: "ఈమెయిల్ చిరునామా",
    parentEmailLabel: "తల్లిదండ్రుల ఈమెయిల్ చిరునామా",
    childEmailLabel: "పిల్లల ఈమెయిల్ చిరునామా",
    passwordLabel: "పాస్‌వర్డ్",
    loginButton: "లాగిన్",
    noAccount: "ఖాతా లేదా?",
    createOne: "కొత్త ఖాతా సృష్టించండి",

    createAccount: "ఖాతాను సృష్టించండి",
    signupSub: "ఆహార పదార్థాలను సులభంగా అర్థం చేసుకోవడానికి న్యూట్రిగార్డ్‌లో చేరండి.",
    fullNameLabel: "పూర్తి పేరు",
    accountTypeLabel: "ఖాతా రకం",
    personal: "వ్యక్తిగత",
    parent: "కుటుంబం / తల్లిదండ్రులు",
    child: "పిల్లలు",
    childAccount: "పిల్లల ఖాతా",
    childNameLabel: "పిల్లల పూర్తి పేరు",
    parentNameLabel: "తల్లిదండ్రుల పూర్తి పేరు",
    childLoginSub: "OTP ఉపయోగించి మీ పిల్లల ఈమెయిల్‌తో లాగిన్ అవ్వండి",
    childAllergensLabel: "పిల్లల అలర్జీలు",
    childFoodPrefLabel: "పిల్లల ఆహార ప్రాధాన్యత",
    sendOtp: "ధృవీకరణ కోడ్ పంపండి",

    verifyEmail: "ఈమెయిల్ ధృవీకరణ",
    checkEmailTitle: "మీ ఈమెయిల్ తనిఖీ చేయండి",
    sentOtpTo: "మేము 6 అంకెల ధృవీకరణ కోడ్‌ను పంపాము:",
    otpSentDesc: "మీ ఈమెయిల్‌కు వచ్చిన 6 అంకెల కోడ్‌ను కింద నమోదు చేయండి.",
    verifyButton: "ధృవీకరించి కొనసాగించండి",
    resendOtp: "కోడ్ మళ్ళీ పంపండి",
    resendIn: "మళ్ళీ పంపడానికి సమయం:",
    skipForNow: "ప్రస్తుతానికి దాటవేయి →",

    profileTitle: "మీ ఆరోగ్య ప్రొఫైల్",
    profileSub: "మీ ఆహార నియమాలు మరియు అలెర్జీలను ఇక్కడ సర్దుబాటు చేసుకోండి.",
    dietaryPreferences: "ఆహార ప్రాధాన్యతలు",
    allergens: "అలెర్జీలు",
    saveProfile: "ప్రొఫైల్ భద్రపరచండి",
    saving: "భద్రపరుస్తోంది...",
    profileSaved: "ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది!",

    scannerTitle: "ఆహార పదార్థాల విశ్లేషణ",
    scannerSub: "ప్యాకేజ్డ్ ఫుడ్ పై ఉన్న పదార్థాల జాబితాను ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి.",
    uploadImage: "ఫోటో అప్‌లోడ్ చేయండి",
    useCamera: "కెమెరా ఉపయోగించండి",
    takePhoto: "ఫోటో తీయండి",
    capturePhoto: "చిత్రాన్ని తీయండి",
    cancel: "రద్దు చేయండి",
    changeImage: "ఫోటో మార్చండి",
    analyzeButton: "పదార్థాలను విశ్లేషించండి",
    analyzing: "విశ్లేషిస్తోంది...",

    analysisResult: "పదార్థాల విశ్లేషణ ఫలితం",
    scanDate: "స్కాన్ చేసిన తేదీ",
    status: "విశ్లేషణ స్థితి",
    successStatus: "అన్నీ గుర్తించబడ్డాయి",
    partialStatus: "కొన్ని గుర్తించబడ్డాయి",
    readAloud: "వినండి",
    summaryTitle: "ముఖ్య ఫలితాలు",
    identifiedIngredients: "గుర్తించిన పదార్థాలు",
    unrecognizedText: "గుర్తించబడని పదాలు",
    technologicalFunction: "సాంకేతిక ఉపయోగం (Function)",
    officialStandard: "అధికారిక ప్రమాణం",
    evidenceSummary: "శాస్త్రీయ ఆధారాల సారాంశం",
    sourceOrg: "అధికారిక సంస్థ",
    viewOfficialSource: "అధికారిక మూల లింక్",
    informationNotAvailable: "డేటాబేస్‌లో సమాచారం అందుబాటులో లేదు",
    scanAnother: "మరొక ఉత్పత్తిని స్కాన్ చేయండి",

    safetyScoreTitle: "భద్రతా స్కోరు",
    interpretationLabel: "వివరణ",
    keyFindings: "ముఖ్య ఫలితాలు",
    identifiedCountLabel: "గుర్తించిన పదార్థాలు",
    attentionCountLabel: "శ్రద్ధ అవసరమైన పదార్థాలు",
    cleanCountLabel: "సహజ మరియు స్వచ్ఛమైన పదార్థాలు",
    unrecognizedCountLabel: "గుర్తించని పదార్థాలు",
    viewDetails: "వివరాలను చూడండి",
    hideDetails: "వివరాలను దాచండి",
    scoreExplanation: "ఈ స్కోరు ఎలా లెక్కించబడింది",
    allergenAlertTitle: "అలెర్జీ హెచ్చరిక గుర్తించబడింది",
    childAllergenAlertTitle: "పిల్లల అలెర్జీ హెచ్చరిక గుర్తించబడింది",
    evidenceCoverageLabel: "ఆధారాల శాతం",
    retakePhoto: "మళ్లీ ఫోటో తీయండి",
    scanIngredients: "పదార్థాలను స్కాన్ చేయండి",
    cameraGuidance: "పదార్థాల జాబితాను ఫ్రేమ్‌లో ఉంచండి మరియు అక్షరాలు స్పష్టంగా వెలుతురులో ఉండేలా చూసుకోండి.",
    cameraPermissionDenied: "కెమెరా అనుమతి నిరాకరించబడింది లేదా అందుబాటులో లేదు. దయచేసి అనుమతించండి లేదా ఫోటో అప్‌లోడ్ చేయండి.",

    veg: "శాఖాహారం (Vegetarian)",
    vegan: "వీగన్ (Vegan)",
    glutenFree: "గ్లూటెన్ రహితం (Gluten-Free)",
    dairyFree: "పాల ఉత్పత్తులు లేనివి (Dairy-Free)",
    halal: "హలాల్ (Halal)",
    nuts: "నట్స్ & వేరుశెనగలు",
    milk: "పాలు & పాల ఉత్పత్తులు",
    wheat: "గోధుమ & గ్లూటెన్",
    soy: "సోయా",
    eggs: "గుడ్లు"
  },

  "हिन्दी": {
    appName: "न्यूट्रिगार्ड",
    selectLanguage: "भाषा",
    back: "पीछे जाएं",
    scanHistory: "स्कैन इतिहास",
    signOut: "साइन आउट",
    editProfile: "प्रोफ़ाइल सेटिंग्स",

    welcomeHeadline: "जानिए आप क्या खा रहे हैं।",
    welcomeSub: "पैकेज्ड फूड के इंग्रिडिएंट्स स्कैन करें। एडिटिव्स, प्रिजर्वेटिव्स और रंगों की वैज्ञानिक जानकारी प्राप्त करें।",
    getStarted: "शुरू करें",
    signIn: "लॉग इन करें",
    haveAccount: "क्या आपके पास पहले से खाता है?",

    welcomeBack: "वापसी पर स्वागत है",
    loginSub: "अपने स्कैन इतिहास तक पहुंचने के लिए अपने ईमेल से लॉग इन करें।",
    emailLabel: "ईमेल पता",
    parentEmailLabel: "माता-पिता का ईमेल पता",
    childEmailLabel: "बच्चे का ईमेल पता",
    passwordLabel: "पासवर्ड",
    loginButton: "लॉग इन करें",
    noAccount: "खाता नहीं है?",
    createOne: "खाता बनाएं",

    createAccount: "खाता बनाएं",
    signupSub: "खाद्य पदार्थों को आसानी से समझने के लिए न्यूट्रिगार्ड से जुड़ें।",
    fullNameLabel: "पूरा नाम",
    accountTypeLabel: "खाता प्रकार",
    personal: "व्यक्तिगत",
    parent: "परिवार / माता-पिता",
    child: "बच्चा",
    childAccount: "बच्चे का खाता",
    childNameLabel: "बच्चे का पूरा नाम",
    parentNameLabel: "माता-पिता का पूरा नाम",
    childLoginSub: "OTP का उपयोग करके अपने बच्चे के ईमेल से लॉगिन करें",
    childAllergensLabel: "बच्चे की एलर्जी",
    childFoodPrefLabel: "बच्चे की भोजन पसंद",
    sendOtp: "सत्यापन कोड भेजें",

    verifyEmail: "ईमेल सत्यापन",
    checkEmailTitle: "अपना ईमेल चेक करें",
    sentOtpTo: "हमने 6-अंकीय सत्यापन कोड भेजा है:",
    otpSentDesc: "अपने ईमेल पर प्राप्त 6-अंकीय कोड को नीचे दर्ज करें।",
    verifyButton: "सत्यापित करें और आगे बढ़ें",
    resendOtp: "कोड दोबारा भेजें",
    resendIn: "पुनः भेजने का समय:",
    skipForNow: "अभी छोड़ें →",

    profileTitle: "आपकी स्वास्थ्य प्रोफ़ाइल",
    profileSub: "अपनी प्राथमिकताओं और एलर्जी के अनुसार चेतावनियों को सेट करें।",
    dietaryPreferences: "आहार संबंधी प्राथमिकताएं",
    allergens: "एलर्जी / संवेदनशीलता",
    saveProfile: "प्रोफ़ाइल सहेजें",
    saving: "सहेजा जा रहा है...",
    profileSaved: "प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!",

    scannerTitle: "खाद्य सामग्री विश्लेषक",
    scannerSub: "पैकेज्ड खाद्य सामग्री की सूची का फोटो लें या अपलोड करें।",
    uploadImage: "फोटो अपलोड करें",
    useCamera: "कैमरा उपयोग करें",
    takePhoto: "फोटो लें",
    capturePhoto: "चित्र लें",
    cancel: "रद्द करें",
    changeImage: "फोटो बदलें",
    analyzeButton: "सामग्री का विश्लेषण करें",
    analyzing: "विश्लेषण जारी है...",

    analysisResult: "सामग्री विश्लेषण परिणाम",
    scanDate: "स्कैन तिथि",
    status: "प्रसंस्करण स्थिति",
    successStatus: "सभी पहचानी गईं",
    partialStatus: "आंशिक रूप से पहचानी गईं",
    readAloud: "सुनें",
    summaryTitle: "निष्कर्ष और सारांश",
    identifiedIngredients: "पहचानी गई सामग्रियां",
    unrecognizedText: "अपरिचित शब्द",
    technologicalFunction: "तकनीकी कार्य (Function)",
    officialStandard: "आधिकारिक मानक",
    evidenceSummary: "वैज्ञानिक साक्ष्य सारांश",
    sourceOrg: "स्रोत संगठन",
    viewOfficialSource: "आधिकारिक स्रोत लिंक",
    informationNotAvailable: "डेटाबेस में जानकारी उपलब्ध नहीं है",
    scanAnother: "अन्य उत्पाद स्कैन करें",

    safetyScoreTitle: "सुरक्षा स्कोर",
    interpretationLabel: "व्याख्या",
    keyFindings: "मुख्य निष्कर्ष",
    identifiedCountLabel: "पहचाने गए तत्व",
    attentionCountLabel: "ध्यान देने योग्य तत्व",
    cleanCountLabel: "स्वच्छ और प्राकृतिक तत्व",
    unrecognizedCountLabel: "अज्ञात तत्व",
    viewDetails: "विवरण देखें",
    hideDetails: "विवरण छुपाएं",
    scoreExplanation: "इस स्कोर की गणना कैसे की गई",
    allergenAlertTitle: "एलर्जी चेतावनी पहचानी गई",
    childAllergenAlertTitle: "बच्चे की एलर्जी चेतावनी पहचानी गई",
    evidenceCoverageLabel: "प्रमाण कवरेज",
    retakePhoto: "फोटो दोबारा लें",
    scanIngredients: "सामग्री स्कैन करें",
    cameraGuidance: "सामग्री सूची को फ्रेम के अंदर रखें और सुनिश्चित करें कि टेक्स्ट स्पष्ट और अच्छी तरह से प्रकाशित है।",
    cameraPermissionDenied: "कैमरा एक्सेस अस्वीकृत या अनुपलब्ध है। कृपया अनुमति दें या फोटो अपलोड करें।",

    veg: "शाकाहारी (Vegetarian)",
    vegan: "वीगन (Vegan)",
    glutenFree: "ग्लूटेन-मुक्त",
    dairyFree: "डेयरी-मुक्त",
    halal: "हलाल",
    nuts: "मेवे और मूंगफली",
    milk: "दूध और डेयरी",
    wheat: "गेहूं और ग्लूटेन",
    soy: "सोया",
    eggs: "अंडे"
  },

  "தமிழ்": {
    appName: "நியூட்ரிகார்ட்",
    selectLanguage: "மொழி",
    back: "பின்செல்",
    scanHistory: "ஸ்கேன் வரலாறு",
    signOut: "வெளியேறு",
    editProfile: "சுயவிவர அமைப்புகள்",

    welcomeHeadline: "நீங்கள் என்ன சாப்பிடுகிறீர்கள் என்று தெரிந்து கொள்ளுங்கள்.",
    welcomeSub: "பாக்கெட் உணவுப் பொருட்களின் உள்ளடக்கங்களை ஸ்கேன் செய்யுங்கள். அதிகாரப்பூர்வ அறிவியல் தகவல்களைப் பெறுங்கள்.",
    getStarted: "தொடங்குங்கள்",
    signIn: "உள்நுழைக",
    haveAccount: "ஏற்கனவே கணக்கு உள்ளதா?",

    welcomeBack: "மீண்டும் வருக",
    loginSub: "உங்கள் ஸ்கேன் வரலாற்றைப் பார்க்க உள்நுழையவும்.",
    emailLabel: "மின்னஞ்சல் முகவரி",
    parentEmailLabel: "பெற்றோரின் மின்னஞ்சல் முகவரி",
    childEmailLabel: "குழந்தையின் மின்னஞ்சல் முகவரி",
    passwordLabel: "கடவுச்சொல்",
    loginButton: "உள்நுழைக",
    noAccount: "கணக்கு இல்லையா?",
    createOne: "கணக்கை உருவாக்கவும்",

    createAccount: "கணக்கை உருவாக்கவும்",
    signupSub: "உணவுப் பொருட்களை எளிதில் புரிந்துகொள்ள நியூட்ரிகார்டில் இணையுங்கள்.",
    fullNameLabel: "முழு பெயர்",
    accountTypeLabel: "கணக்கு வகை",
    personal: "தனிப்பட்ட",
    parent: "குடும்பம் / பெற்றோர்",
    child: "குழந்தை",
    childAccount: "குழந்தை கணக்கு",
    childNameLabel: "குழந்தையின் முழுப் பெயர்",
    parentNameLabel: "பெற்றோரின் முழுப் பெயர்",
    childLoginSub: "OTP ஐப் பயன்படுத்தி குழந்தையின் மின்னஞ்சலுடன் உள்நுழைக",
    childAllergensLabel: "குழந்தையின் ஒவ்வாமைகள்",
    childFoodPrefLabel: "குழந்தையின் உணவு விருப்பம்",
    sendOtp: "சரிபார்ப்புக் குறியீட்டை அனுப்பு",

    verifyEmail: "மின்னஞ்சல் சரிபார்ப்பு",
    checkEmailTitle: "உங்கள் மின்னஞ்சலை சரிபார்க்கவும்",
    sentOtpTo: "நாங்கள் 6 இலக்கக் குறியீட்டை அனுப்பியுள்ளோம்:",
    otpSentDesc: "உங்கள் மின்னஞ்சலுக்கு வந்த 6 இலக்கக் குறியீட்டை உள்ளிடவும்.",
    verifyButton: "சரிபார்த்து தொடரவும்",
    resendOtp: "குறியீட்டை மீண்டும் அனுப்பு",
    resendIn: "மீண்டும் அனுப்ப நேரம்:",
    skipForNow: "இப்போது தவிர்க்கவும் →",

    profileTitle: "உங்கள் சுகாதார விவரம்",
    profileSub: "உங்கள் உணவு பழக்கவழக்கங்கள் மற்றும் ஒவ்வாமைகளை அமைக்கவும்.",
    dietaryPreferences: "உணவு விருப்பங்கள்",
    allergens: "ஒவ்வாமைகள் (Allergens)",
    saveProfile: "சுயவிவரத்தைச் சேமி",
    saving: "சேமிக்கிறது...",
    profileSaved: "சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!",

    scannerTitle: "உணவுப் பொருட்கள் பகுப்பாய்வி",
    scannerSub: "உணவுப் பாக்கெட்டின் உள்ளடக்கப் பட்டியலை படம் எடுக்கவும் அல்லது பதிவேற்றவும்.",
    uploadImage: "படத்தைப் பதிவேற்றவும்",
    useCamera: "கேமராவைப் பயன்படுத்தவும்",
    takePhoto: "படம் எடுக்கவும்",
    capturePhoto: "படத்தைப் பிடிக்கவும்",
    cancel: "ரத்து செய்",
    changeImage: "படத்தை மாற்றவும்",
    analyzeButton: "பகுப்பாய்வு செய்",
    analyzing: "பகுப்பாய்வு செய்கிறது...",

    analysisResult: "பகுப்பாய்வு முடிவுகள்",
    scanDate: "ஸ்கேன் தேதி",
    status: "நிலை",
    successStatus: "அனைத்தும் அடையாளம் காணப்பட்டன",
    partialStatus: "சில அடையாளம் காணப்பட்டன",
    readAloud: "கேளுங்கள்",
    summaryTitle: "கண்டுபிடிப்புகள்",
    identifiedIngredients: "கண்டறியப்பட்ட பொருட்கள்",
    unrecognizedText: "அடையாளம் காணப்படாதவை",
    technologicalFunction: "பயன்பாடு (Function)",
    officialStandard: "அதிகாரப்பூர்வ தரம்",
    evidenceSummary: "அறிவியல் ஆதார சுருக்கம்",
    sourceOrg: "அமைப்பின் பெயர்",
    viewOfficialSource: "அதிகாரப்பூர்வ இணைப்பு",
    informationNotAvailable: "தகவல் கிடைக்கவில்லை",
    scanAnother: "மற்றொரு பொருளை ஸ்கேன் செய்",

    safetyScoreTitle: "பாதுகாப்பு மதிப்பெண்",
    interpretationLabel: "விளக்கம்",
    keyFindings: "முக்கிய கண்டுபிடிப்புகள்",
    identifiedCountLabel: "அடையாளம் காணப்பட்ட பொருட்கள்",
    attentionCountLabel: "கவனம் தேவைப்படும் பொருட்கள்",
    cleanCountLabel: "தூய மற்றும் இயற்கைப் பொருட்கள்",
    unrecognizedCountLabel: "அடையாளம் தெரியாத பொருட்கள்",
    viewDetails: "விவரங்களைக் காண்க",
    hideDetails: "விவரங்களை மறை",
    scoreExplanation: "இந்த மதிப்பெண் எவ்வாறு கணக்கிடப்பட்டது",
    allergenAlertTitle: "ஒவ்வாமை எச்சரிக்கை கண்டறியப்பட்டது",
    childAllergenAlertTitle: "குழந்தைக்கான ஒவ்வாமை எச்சரிக்கை",
    evidenceCoverageLabel: "ஆதாரங்களின் அளவு",
    retakePhoto: "மீண்டும் புகைப்படம் எடு",
    scanIngredients: "பொருட்களை ஸ்கேன் செய்க",
    cameraGuidance: "பொருட்கள் பட்டியலை சட்டகத்திற்குள் வைத்து எழுத்துக்கள் தெளிவாகவும் வெளிச்சமாகவும் இருப்பதை உறுதிசெய்யவும்.",
    cameraPermissionDenied: "கேமரா அணுகல் மறுக்கப்பட்டது. கேமரா அனுமதியை இயக்கவும் அல்லது புகைப்படத்தை பதிவேற்றவும்.",

    veg: "சைவம் (Vegetarian)",
    vegan: "வீகன் (Vegan)",
    glutenFree: "குளுட்டன் இல்லாதது",
    dairyFree: "பால் பொருட்கள் இல்லாதது",
    halal: "ஹலால்",
    nuts: "கொட்டைகள் & கடலை",
    milk: "பால்",
    wheat: "கோதுமை",
    soy: "சோயா",
    eggs: "முட்டைகள்"
  },

  "ಕನ್ನಡ": {
    appName: "ನ್ಯೂಟ್ರಿಗಾರ್ಡ್",
    selectLanguage: "ಭಾಷೆ",
    back: "ಹಿಂದಕ್ಕೆ",
    scanHistory: "ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸ",
    signOut: "ಸೈನ್ ಔಟ್",
    editProfile: "ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್ಸ್",

    welcomeHeadline: "ನೀವು ಏನು ತಿನ್ನುತ್ತಿದ್ದೀರಿ ಎಂದು ತಿಳಿಯಿರಿ.",
    welcomeSub: "ಪ್ಯಾಕ್ ಮಾಡಿದ ಆಹಾರ ಪದಾರ್ಥಗಳನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಮತ್ತು ಅಧಿಕೃತ ವೈಜ್ಞಾನಿಕ ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಿರಿ.",
    getStarted: "ಪ್ರಾರಂಭಿಸಿ",
    signIn: "ಸೈನ್ ಇನ್",
    haveAccount: "ಖಾತೆ ಇದೆಯೇ?",

    welcomeBack: "ಮರಳಿ ಸ್ವಾಗತ",
    loginSub: "ನಿಮ್ಮ ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸವನ್ನು ನೋಡಲು ಲಾಗಿನ್ ಆಗಿ.",
    emailLabel: "ಇಮೇಲ್ ವಿಳಾಸ",
    parentEmailLabel: "ಪೋಷಕರ ಇಮೇಲ್ ವಿಳಾಸ",
    childEmailLabel: "ಮಕ್ಕಳ ಇಮೇಲ್ ವಿಳಾಸ",
    passwordLabel: "ಪಾಸ್ವರ್ಡ್",
    loginButton: "ಲಾಗಿನ್",
    noAccount: "ಖಾತೆ ಇಲ್ಲವೇ?",
    createOne: "ಖಾತೆ ರಚಿಸಿ",

    createAccount: "ಹೊಸ ಖಾತೆ ರಚಿಸಿ",
    signupSub: "ಆಹಾರ ಪದಾರ್ಥಗಳನ್ನು ಸುಲಭವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನ್ಯೂಟ್ರಿಗಾರ್ಡ್ ಸೇರಿ.",
    fullNameLabel: "ಪೂರ್ಣ ಹೆಸರು",
    accountTypeLabel: "ಖಾತೆ ಪ್ರಕಾರ",
    personal: "ವೈಯಕ್ತಿಕ",
    parent: "ಕುಟುಂಬ / ಪೋಷಕರು",
    child: "ಮಗು",
    childAccount: "ಮಕ್ಕಳ ಖಾತೆ",
    childNameLabel: "ಮಗುವಿನ ಪೂರ್ಣ ಹೆಸರು",
    parentNameLabel: "ಪೋಷಕರ ಪೂರ್ಣ ಹೆಸರು",
    childLoginSub: "OTP ಬಳಸಿ ನಿಮ್ಮ ಮಗುವಿನ ಇಮೇಲ್‌ನೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ",
    childAllergensLabel: "ಮಗುವಿನ ಅಲರ್ಜಿಗಳು",
    childFoodPrefLabel: "ಮಗುವಿನ ಆಹಾರ ಆದ್ಯತೆ",
    sendOtp: "ಪರಿಶೀಲನಾ ಕೋಡ್ ಕಳುಹಿಸಿ",

    verifyEmail: "ಇಮೇಲ್ ಪರಿಶೀಲನೆ",
    checkEmailTitle: "ನಿಮ್ಮ ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ",
    sentOtpTo: "ನಾವು 6 ಅಂಕಿಯ ಕೋಡ್ ಕಳುಹಿಸಿದ್ದೇವೆ:",
    otpSentDesc: "ನಿಮ್ಮ ಇಮೇಲ್‌ಗೆ ಬಂದ 6 ಅಂಕಿಯ ಕೋಡ್ ಅನ್ನು ನಮೂದಿಸಿ.",
    verifyButton: "ಪರಿಶೀಲಿಸಿ ಮುಂದುವರಿಯಿರಿ",
    resendOtp: "ಕೋಡ್ ಮರುಕಳುಹಿಸಿ",
    resendIn: "ಮರುಕಳುಹಿಸಲು ಸಮಯ:",
    skipForNow: "ಸದ್ಯಕ್ಕೆ ಬಿಟ್ಟುಬಿಡಿ →",

    profileTitle: "ನಿಮ್ಮ ಆರೋಗ್ಯ ಪ್ರೊಫೈಲ್",
    profileSub: "ನಿಮ್ಮ ಆಹಾರ ಪದ್ಧತಿ ಮತ್ತು ಅಲರ್ಜಿಗಳನ್ನು ಹೊಂದಿಸಿ.",
    dietaryPreferences: "ಆಹಾರ ಆದ್ಯತೆಗಳು",
    allergens: "ಅಲರ್ಜಿಗಳು",
    saveProfile: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ",
    saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    profileSaved: "ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",

    scannerTitle: "ಆಹಾರ ಪದಾರ್ಥ ವಿಶ್ಲೇಷಕ",
    scannerSub: "ಆಹಾರದ ಲೇಬಲ್ ಅನ್ನು ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಅಪ್ಲೋಡ್ ಮಾಡಿ.",
    uploadImage: "ಚಿತ್ರ ಅಪ್ಲೋಡ್ ಮಾಡಿ",
    useCamera: "ಕ್ಯಾಮೆರಾ ಬಳಸಿ",
    takePhoto: "ಫೋಟೋ ತೆಗೆಯಿರಿ",
    capturePhoto: "ಚಿತ್ರ ಸೆರೆಹಿಡಿಯಿರಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    changeImage: "ಚಿತ್ರ ಬದಲಾಯಿಸಿ",
    analyzeButton: "ಪದಾರ್ಥಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ",
    analyzing: "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",

    analysisResult: "ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶ",
    scanDate: "ಸ್ಕ್ಯಾನ್ ದಿನಾಂಕ",
    status: "ಸ್ಥಿತಿ",
    successStatus: "ಎಲ್ಲವನ್ನೂ ಗುರುತಿಸಲಾಗಿದೆ",
    partialStatus: "ಕೆಲವನ್ನು ಗುರುತಿಸಲಾಗಿದೆ",
    readAloud: "ಆಲಿಸಿ",
    summaryTitle: "ಸಾರಾಂಶ",
    identifiedIngredients: "ಗುರುತಿಸಲಾದ ಪದಾರ್ಥಗಳು",
    unrecognizedText: "ಗುರುತಿಸಲಾಗದ ಪದಗಳು",
    technologicalFunction: "ಕಾರ್ಯ (Function)",
    officialStandard: "ಅಧಿಕೃತ ಮಾನದಂಡ",
    evidenceSummary: "ವೈಜ್ಞಾನಿಕ ಪುರಾವೆ",
    sourceOrg: "ಮೂಲ ಸಂಸ್ಥೆ",
    viewOfficialSource: "ಅಧಿಕೃತ ಲಿಂಕ್",
    informationNotAvailable: "ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ",
    scanAnother: "ಮತ್ತೊಂದು ಉತ್ಪನ್ನ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",

    safetyScoreTitle: "ಸುರಕ್ಷತಾ ಸ್ಕೋರ್",
    interpretationLabel: "ವಿವರಣೆ",
    keyFindings: "ಮುಖ್ಯ ಫಲಿತಾಂಶಗಳು",
    identifiedCountLabel: "ಗುರುತಿಸಲಾದ ಪದಾರ್ಥಗಳು",
    attentionCountLabel: "ಗಮನ ಹರಿಸಬೇಕಾದ ಪದಾರ್ಥಗಳು",
    cleanCountLabel: "ಸ್ವಚ್ಛ ಮತ್ತು ನೈಸರ್ಗಿಕ ಪದಾರ್ಥಗಳು",
    unrecognizedCountLabel: "ಗುರುತಿಸಲಾಗದ ಪದಾರ್ಥಗಳು",
    viewDetails: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    hideDetails: "ವಿವರಗಳನ್ನು ಮರೆಮಾಡಿ",
    scoreExplanation: "ಈ ಸ್ಕೋರ್ ಅನ್ನು ಹೇಗೆ ಲೆಕ್ಕಹಾಕಲಾಗಿದೆ",
    allergenAlertTitle: "ಅಲರ್ಜಿ ಎಚ್ಚರಿಕೆ ಪತ್ತೆಯಾಗಿದೆ",
    childAllergenAlertTitle: "ಮಕ್ಕಳ ಅಲರ್ಜಿ ಎಚ್ಚರಿಕೆ ಪತ್ತೆಯಾಗಿದೆ",
    evidenceCoverageLabel: "ಆಧಾರಗಳ ವ್ಯಾಪ್ತಿ",
    retakePhoto: "ಮತ್ತೆ ಫೋಟೋ ತೆಗೆಯಿರಿ",
    scanIngredients: "ಪದಾರ್ಥಗಳನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    cameraGuidance: "ಪದಾರ್ಥಗಳ ಪಟ್ಟಿಯನ್ನು ಚೌಕಟ್ಟಿನೊಳಗೆ ಇರಿಸಿ ಮತ್ತು ಪಠ್ಯವು ಸ್ಪಷ್ಟವಾಗಿದೆ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
    cameraPermissionDenied: "ಕ್ಯಾಮೆರಾ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಅನುಮತಿಸಿ ಅಥವಾ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",

    veg: "ಸಸ್ಯಾಹಾರಿ (Vegetarian)",
    vegan: "ವೀರನ್ (Vegan)",
    glutenFree: "ಗ್ಲುಟನ್ ಮುಕ್ತ",
    dairyFree: "ಡೈರಿ ಮುಕ್ತ",
    halal: "ಹಲಾಲ್",
    nuts: "ಬೀಜಗಳು & ಕಡಲೆಕಾಯಿ",
    milk: "ಹಾಲು & ಉತ್ಪನ್ನಗಳು",
    wheat: "ಗೋಧಿ & ಗ್ಲುಟನ್",
    soy: "ಸೋಯಾ",
    eggs: "ಮೊಟ್ಟೆಗಳು"
  },

  "മലയാളം": {
    appName: "ന്യൂട്രിഗാർഡ്",
    selectLanguage: "ഭാഷ",
    back: "തിരികെ",
    scanHistory: "സ്കാൻ ഹിസ്റ്ററി",
    signOut: "സൈൻ ഔട്ട്",
    editProfile: "പ്രൊഫൈൽ ക്രമീകരണങ്ങൾ",

    welcomeHeadline: "നിങ്ങൾ കഴിക്കുന്നത് എന്താണെന്ന് അറിയുക.",
    welcomeSub: "ഭക്ഷണ ലേബലുകൾ സ്കാൻ ചെയ്യുക. രാസവസ്തുക്കളെക്കുറിച്ചും സുരക്ഷയെക്കുറിച്ചും അറിയുക.",
    getStarted: "ആരംഭിക്കുക",
    signIn: "സൈൻ ഇൻ",
    haveAccount: "അക്കൗണ്ട് ഉണ്ടോ?",

    welcomeBack: "സ്വാഗതം",
    loginSub: "സ്കാൻ വിവരങ്ങൾ കാണാൻ ലോഗിൻ ചെയ്യുക.",
    emailLabel: "ഇമെയിൽ വിലാസം",
    parentEmailLabel: "മാതാപിതാക്കളുടെ ഇമെയിൽ വിലാസം",
    childEmailLabel: "കുട്ടിയുടെ ഇമെയിൽ വിലാസം",
    passwordLabel: "പാസ്‌വേഡ്",
    loginButton: "ലോഗിൻ",
    noAccount: "അക്കൗണ്ട് ഇല്ലേ?",
    createOne: "അക്കൗണ്ട് ഉണ്ടാക്കുക",

    createAccount: "അക്കൗണ്ട് ഉണ്ടാക്കുക",
    signupSub: "ഭക്ഷണ പദാർത്ഥങ്ങൾ എളുപ്പത്തിൽ മനസ്സിലാക്കാൻ ന്യൂട്രിഗാർഡിൽ ചേരുക.",
    fullNameLabel: "പൂർണ്ണമായ പേര്",
    accountTypeLabel: "അക്കൗണ്ട് തരം",
    personal: "വ്യക്തിഗതം",
    parent: "കുടുംബം",
    child: "കുട്ടി",
    childAccount: "കുട്ടിയുടെ അക്കൗണ്ട്",
    childNameLabel: "കുട്ടിയുടെ പൂർണ്ണ പേര്",
    parentNameLabel: "മാതാപിതാക്കളുടെ പൂർണ്ണ പേര്",
    childLoginSub: "OTP ഉപയോഗിച്ച് കുട്ടിയുടെ ഇമെയിൽ വഴി ലോഗിൻ ചെയ്യുക",
    childAllergensLabel: "കുട്ടിയുടെ അലർജികൾ",
    childFoodPrefLabel: "കുട്ടിയുടെ ഭക്ഷണ മുൻഗണന",
    sendOtp: "കോഡ് അയക്കുക",

    verifyEmail: "ഇമെയിൽ സ്ഥിരീകരണം",
    checkEmailTitle: "ഇമെയിൽ പരിശോധിക്കുക",
    sentOtpTo: "ഞങ്ങൾ 6 അക്ക കോഡ് അയച്ചിട്ടുണ്ട്:",
    otpSentDesc: "ലഭിച്ച 6 അക്ക കോഡ് നൽകുക.",
    verifyButton: "സ്ഥിരീകരിച്ച് തുടരുക",
    resendOtp: "കോഡ് വീണ്ടും അയക്കുക",
    resendIn: "സമയം:",
    skipForNow: "ഇപ്പോൾ ഒഴിവാക്കുക →",

    profileTitle: "ആരോഗ്യ പ്രൊഫൈൽ",
    profileSub: "നിങ്ങളുടെ ഭക്ഷണരീതികളും അലർജികളും ക്രമീകരിക്കുക.",
    dietaryPreferences: "ഭക്ഷണ മുൻഗണനകൾ",
    allergens: "അലർജികൾ",
    saveProfile: "പ്രൊഫൈൽ സേവ് ചെയ്യുക",
    saving: "സേവ് ചെയ്യുന്നു...",
    profileSaved: "വിജയകരമായി അപ്‌ഡേറ്റുചെയ്‌തു!",

    scannerTitle: "ഫുഡ് അനലൈസർ",
    scannerSub: "പാക്കറ്റ് ഭക്ഷണത്തിന്റെ ചേരുവകൾ ഫോട്ടോ എടുക്കുക.",
    uploadImage: "ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക",
    useCamera: "ക്യാമറ ഉപയോഗിക്കുക",
    takePhoto: "ഫോട്ടോ എടുക്കുക",
    capturePhoto: "ചിത്രമെടുക്കുക",
    cancel: "റദ്ദാക്കുക",
    changeImage: "ഫോട്ടോ മാറ്റുക",
    analyzeButton: "പരിശോധിക്കുക",
    analyzing: "പരിശോധിക്കുന്നു...",

    analysisResult: "ഫലങ്ങൾ",
    scanDate: "തീയതി",
    status: "അവസ്ഥ",
    successStatus: "കണ്ടെത്തി",
    partialStatus: "ഭാഗികമായി കണ്ടെത്തി",
    readAloud: "കേൾക്കുക",
    summaryTitle: "സംഗ്രഹം",
    identifiedIngredients: "കണ്ടെത്തിയ ചേരുവകൾ",
    unrecognizedText: "തിരിച്ചറിയാത്തവ",
    technologicalFunction: "ഉപയോഗം (Function)",
    officialStandard: "ഔദ്യോഗിക മാനദണ്ഡം",
    evidenceSummary: "ശാസ്ത്രീയ തെളിവുകൾ",
    sourceOrg: "സ്ഥാപനം",
    viewOfficialSource: "ലിങ്ക്",
    informationNotAvailable: "വിവരങ്ങൾ ലഭ്യമല്ല",
    scanAnother: "മറ്റൊന്ന് സ്കാൻ ചെയ്യുക",

    safetyScoreTitle: "സുരക്ഷാ സ്കോർ",
    interpretationLabel: "വിശദീകരണം",
    keyFindings: "പ്രധാന കണ്ടെത്തലുകൾ",
    identifiedCountLabel: "തിരിച്ചറിഞ്ഞ ചേരുവകൾ",
    attentionCountLabel: "ശ്രദ്ധിക്കേണ്ട ചേരുവകൾ",
    cleanCountLabel: "സ്വാഭാവിക ചേരുവകൾ",
    unrecognizedCountLabel: "തിരിച്ചറിയാത്ത ചേരുവകൾ",
    viewDetails: "വിശദാംശങ്ങൾ കാണുക",
    hideDetails: "വിശദാംശങ്ങൾ മറയ്ക്കുക",
    scoreExplanation: "ഈ സ്കോർ എങ്ങനെ കണക്കാക്കി",
    allergenAlertTitle: "അലർജി മുന്നറിയിപ്പ് കണ്ടെത്തി",
    childAllergenAlertTitle: "കുട്ടിയുടെ അലർജി മുന്നറിയിപ്പ്",
    evidenceCoverageLabel: "തെളിവുകളുടെ പരിധി",
    retakePhoto: "വീണ്ടും ഫോട്ടോ എടുക്കുക",
    scanIngredients: "ചേരുവകൾ സ്കാൻ ചെയ്യുക",
    cameraGuidance: "ചേരുവകളുടെ പട്ടിക ഫ്രെയിമിൽ വെക്കുക, അക്ഷരങ്ങൾ വ്യക്തമാണെന്ന് ഉറപ്പാക്കുക.",
    cameraPermissionDenied: "ക്യാമറ ആക്സസ് നിരസിച്ചു. ദയവായി അനുമതി നൽകുക അല്ലെങ്കിൽ ചിത്രം അപ്‌ലോഡ് ചെയ്യുക.",

    veg: "സസ്യാഹാരം",
    vegan: "വീഗൻ",
    glutenFree: "ഗ്ലൂട്ടൻ രഹിതം",
    dairyFree: "പാലുൽപ്പന്ന രഹിതം",
    halal: "ഹലാൽ",
    nuts: "പരിപ്പുകൾ",
    milk: "പാൽ",
    wheat: "ഗോതമ്പ്",
    soy: "സോയ",
    eggs: "മുട്ട"
  },

  "मराठी": {
    appName: "न्यूट्रिगार्ड",
    selectLanguage: "भाषा",
    back: "मागे जा",
    scanHistory: "स्कॅन इतिहास",
    signOut: "साइन आउट",
    editProfile: "प्रोफाइल सेटिंग्ज",

    welcomeHeadline: "तुम्ही काय खात आहात ते जाणून घ्या.",
    welcomeSub: "पॅकेज केलेल्या अन्नावरील घटक स्कॅन करा आणि अधिकृत वैज्ञानिक माहिती मिळवा.",
    getStarted: "सुरू करा",
    signIn: "साइन इन",
    haveAccount: "आधीच खाते आहे का?",

    welcomeBack: "पुन्हा स्वागत आहे",
    loginSub: "स्कॅन इतिहास पाहण्यासाठी लॉगिन करा.",
    emailLabel: "ईमेल पत्ता",
    parentEmailLabel: "पालकांचा ईमेल पत्ता",
    childEmailLabel: "मुलाचा ईमेल पत्ता",
    passwordLabel: "पासवर्ड",
    loginButton: "लॉगिन",
    noAccount: "खाते नाही?",
    createOne: "खाते तयार करा",

    createAccount: "खाते तयार करा",
    signupSub: "अन्नातील घटकांचे विश्लेषण करण्यासाठी न्यूट्रिगार्डमध्ये सामील व्हा.",
    fullNameLabel: "पूर्ण नाव",
    accountTypeLabel: "खात्याचा प्रकार",
    personal: "वैयक्तिक",
    parent: "कुटुंब / पालक",
    child: "मूल",
    childAccount: "मुलाचे खाते",
    childNameLabel: "मुलाचे पूर्ण नाव",
    parentNameLabel: "पालकांचे पूर्ण नाव",
    childLoginSub: "OTP वापरून आपल्या मुलाच्या ईमेलने लॉगिन करा",
    childAllergensLabel: "मुलाच्या अ‍ॅलर्जी",
    childFoodPrefLabel: "मुलाची अन्न पसंती",
    sendOtp: "पडताळणी कोड पाठवा",

    verifyEmail: "ईमेल पडताळणी",
    checkEmailTitle: "तुमचा ईमेल तपासा",
    sentOtpTo: "आम्ही ६ अंकी कोड पाठवला आहे:",
    otpSentDesc: "तुमच्या ईमेलवर आलेला ६ अंकी कोड खाली प्रविष्ट करा.",
    verifyButton: "पडताळणी करा आणि पुढे जा",
    resendOtp: "कोड पुन्हा पाठवा",
    resendIn: "वेळ:",
    skipForNow: "आता वगळा →",

    profileTitle: "आरोग्य प्रोफाइल",
    profileSub: "तुमच्या आहाराच्या गरजा आणि ऍलर्जीनुसार सेटिंग्ज करा.",
    dietaryPreferences: "आहारातील प्राधान्ये",
    allergens: "ऍलर्जी",
    saveProfile: "प्रोफाइल जतन करा",
    saving: "जतन करत आहे...",
    profileSaved: "प्रोफाइल यशस्वीरित्या अद्यतनित झाली!",

    scannerTitle: "अन्न घटक विश्लेषक",
    scannerSub: "घटकांच्या यादीचा फोटो काढा किंवा अपलोड करा.",
    uploadImage: "फोटो अपलोड करा",
    useCamera: "कॅमेरा वापरा",
    takePhoto: "फोटो काढा",
    capturePhoto: "चित्र घ्या",
    cancel: "रद्द करा",
    changeImage: "फोटो बदला",
    analyzeButton: "घटकांचे विश्लेषण करा",
    analyzing: "विश्लेषण सुरू आहे...",

    analysisResult: "विश्लेषण निकाल",
    scanDate: "स्कॅन तारीख",
    status: "स्थिती",
    successStatus: "सर्व ओळखले गेले",
    partialStatus: "काही ओळखले गेले",
    readAloud: "ऐका",
    summaryTitle: "निष्कर्ष",
    identifiedIngredients: "ओळखलेले घटक",
    unrecognizedText: "न ओळखलेले शब्द",
    technologicalFunction: "उपयोग (Function)",
    officialStandard: "अधिकृत मानक",
    evidenceSummary: "वैज्ञानिक पुरावा",
    sourceOrg: "संस्था",
    viewOfficialSource: "अधिकृत लिंक",
    informationNotAvailable: "माहिती उपलब्ध नाही",
    scanAnother: "दुसरे उत्पादन स्कॅन करा",

    safetyScoreTitle: "सुरक्षा स्कोअर",
    interpretationLabel: "स्पष्टीकरण",
    keyFindings: "मुख्य निष्कर्ष",
    identifiedCountLabel: "ओळखलेले घटक",
    attentionCountLabel: "लक्ष देण्यासारखे घटक",
    cleanCountLabel: "स्वच्छ आणि नैसर्गिक घटक",
    unrecognizedCountLabel: "अनोळखी घटक",
    viewDetails: "तपशील पहा",
    hideDetails: "तपशील लपवा",
    scoreExplanation: "हा स्कोअर कसा मोजला गेला",
    allergenAlertTitle: "ॲलर्जी चेतावणी आढळली",
    childAllergenAlertTitle: "मुलांसाठी ॲलर्जी चेतावणी",
    evidenceCoverageLabel: "पुरावा कव्हरेज",
    retakePhoto: "पुन्हा फोटो काढा",
    scanIngredients: "घटक स्कॅन करा",
    cameraGuidance: "घटकांची यादी फ्रेममध्ये ठेवा आणि मजकूर स्पष्ट असल्याची खात्री करा.",
    cameraPermissionDenied: "कॅमेरा ॲक्सेस नाकारला गेला. कृपया परवानगी द्या किंवा फोटो अपलोड करा.",

    veg: "शाकाहारी",
    vegan: "व्हीगन",
    glutenFree: "ग्लूटेन-मुक्त",
    dairyFree: "डेअरी-मुक्त",
    halal: "हलाल",
    nuts: "शेंगदाणे आणि ड्रायफ्रूट्स",
    milk: "दूध",
    wheat: "गहू",
    soy: "सोया",
    eggs: "अंडी"
  },

  "বাংলা": {
    appName: "নিউട്രിগার্ড",
    selectLanguage: "ভাষা",
    back: "ফিরে যান",
    scanHistory: "স্ক্যান ইতিহাস",
    signOut: "সাইন আউট",
    editProfile: "প্রোফাইল সেটিংস",

    welcomeHeadline: "আপনি কী খাচ্ছেন তা জানুন।",
    welcomeSub: "প্যাকেজ করা খাবারের উপাদান স্ক্যান করুন এবং বৈজ্ঞানিক প্রমাণ পান।",
    getStarted: "শুরু করুন",
    signIn: "সাইন ইন",
    haveAccount: "ইতিমধ্যে একটি অ্যাকাউন্ট আছে?",

    welcomeBack: "স্বাগতম",
    loginSub: "আপনার স্ক্যান ইতিহাস দেখতে লগইন করুন।",
    emailLabel: "ইমেল ঠিকানা",
    parentEmailLabel: "পিতামাতার ইমেল ঠিকানা",
    childEmailLabel: "সন্তানের ইমেল ঠিকানা",
    passwordLabel: "পাসওয়ার্ড",
    loginButton: "সাইন ইন",
    noAccount: "অ্যাকাউন্ট নেই?",
    createOne: "অ্যাকাউন্ট তৈরি করুন",

    createAccount: "অ্যাকাউন্ট তৈরি করুন",
    signupSub: "খাবারের উপাদান সহজে বুঝতে নিউট্রিগার্ডে যোগ দিন।",
    fullNameLabel: "পুরো নাম",
    accountTypeLabel: "অ্যাকাউন্টের ধরন",
    personal: "ব্যক্তিগত",
    parent: "পরিবার",
    child: "শিশু",
    childAccount: "সন্তানের অ্যাকাউন্ট",
    childNameLabel: "সন্তানের সম্পূর্ণ নাম",
    parentNameLabel: "পিতামাতার সম্পূর্ণ নাম",
    childLoginSub: "OTP ব্যবহার করে সন্তানের ইমেল দিয়ে লগইন করুন",
    childAllergensLabel: "সন্তানের অ্যালার্জি",
    childFoodPrefLabel: "সন্তানের খাদ্যের পছন্দ",
    sendOtp: "যাচাইকরণ কোড পাঠান",

    verifyEmail: "ইমেল যাচাইকরণ",
    checkEmailTitle: "আপনার ইমেল দেখুন",
    sentOtpTo: "আমরা একটি ৬-সংখ্যার কোড পাঠিয়েছি:",
    otpSentDesc: "আপনার ইমেলে প্রাপ্ত ৬-সংখ্যার কোডটি লিখুন।",
    verifyButton: "যাচাই করুন এবং এগিয়ে যান",
    resendOtp: "কোড পুনরায় পাঠান",
    resendIn: "পুনরায় পাঠানোর সময়:",
    skipForNow: "এখন এড়িয়ে যান →",

    profileTitle: "স্বাস্থ্য প্রোফাইল",
    profileSub: "আপনার খাদ্যাভ্যাস এবং অ্যালার্জি সেট করুন।",
    dietaryPreferences: "খাবারের পছন্দ",
    allergens: "অ্যালার্জি",
    saveProfile: "প্রোফাইল সংরক্ষণ করুন",
    saving: "সংরক্ষণ করা হচ্ছে...",
    profileSaved: "প্রোফাইল সফলভাবে আপডেট হয়েছে!",

    scannerTitle: "খাদ্য উপাদান বিশ্লেষক",
    scannerSub: "উপাদান তালিকার ছবি তুলুন বা আপলোড করুন।",
    uploadImage: "ছবি আপলোড করুন",
    useCamera: "ক্যামেরা ব্যবহার করুন",
    takePhoto: "ছবি তুলুন",
    capturePhoto: "ছবি নিন",
    cancel: "বাতিল করুন",
    changeImage: "ছবি পরিবর্তন করুন",
    analyzeButton: "বিশ্লেষণ করুন",
    analyzing: "বিশ্লেষণ করা হচ্ছে...",

    analysisResult: "ফলাফল",
    scanDate: "স্ক্যান তারিখ",
    status: "অবস্থা",
    successStatus: "সব চিহ্নিত হয়েছে",
    partialStatus: "কিছু চিহ্নিত হয়েছে",
    readAloud: "শুনুন",
    summaryTitle: "সারসংক্ষেপ",
    identifiedIngredients: "শনাক্ত উপাদান",
    unrecognizedText: "অপরিচিত শব্দ",
    technologicalFunction: "কাজ (Function)",
    officialStandard: "অফিসিয়াল মান",
    evidenceSummary: "বৈজ্ঞানিক প্রমাণ",
    sourceOrg: "প্রতিষ্ঠান",
    viewOfficialSource: "অফিসিয়াল লিঙ্ক",
    informationNotAvailable: "তথ্য পাওয়া যায়নি",
    scanAnother: "আরেকটি স্ক্যান করুন",

    safetyScoreTitle: "সুরক্ষা স্কোর",
    interpretationLabel: "ব্যাখ্যা",
    keyFindings: "মূল ফলাফল",
    identifiedCountLabel: "শনাক্ত উপাদান",
    attentionCountLabel: "সতর্কতা প্রয়োজন এমন উপাদান",
    cleanCountLabel: "পরিষ্কার ও প্রাকৃতিক উপাদান",
    unrecognizedCountLabel: "অজানা উপাদান",
    viewDetails: "বিস্তারিত দেখুন",
    hideDetails: "বিস্তারিত লুকান",
    scoreExplanation: "এই স্কোর কীভাবে গণনা করা হয়েছে",
    allergenAlertTitle: "অ্যালার্জি সতর্কতা সনাক্ত হয়েছে",
    childAllergenAlertTitle: "শিশুর অ্যালার্জি সতর্কতা সনাক্ত হয়েছে",
    evidenceCoverageLabel: "প্রমাণ কভারেজ",
    retakePhoto: "আবার ছবি তুলুন",
    scanIngredients: "উপাদান স্ক্যান করুন",
    cameraGuidance: "উপাদান তালিকাটি ফ্রেমের মধ্যে রাখুন এবং লেখাটি স্পষ্ট রয়েছে তা নিশ্চিত করুন।",
    cameraPermissionDenied: "ক্যামেরা অ্যাক্সেস অস্বীকার করা হয়েছে। অনুগ্রহ করে অনুমতি দিন অথবা ছবি আপলোড করুন।",

    veg: "নিরামিষ",
    vegan: "ভেগান",
    glutenFree: "গ্লুটেন-মুক্ত",
    dairyFree: "দুগ্ধ-মুক্ত",
    halal: "হালাল",
    nuts: "বাদাম",
    milk: "দুধ",
    wheat: "গম",
    soy: "সয়াবিন",
    eggs: "ডিম"
  }
};

// ─── STABLE, SINGLE-VOICE TEXT-TO-SPEECH ENGINE ──────────────
// Locks onto a single voice per language and never jumps or alternates

let voiceCache: Map<string, SpeechSynthesisVoice> = new Map();

export function getStableVoice(langCode: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  if (voiceCache.has(langCode)) {
    return voiceCache.get(langCode) || null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Direct language code match (e.g. 'te-IN')
  const targetPrefix = langCode.split("-")[0].toLowerCase();
  
  // Prefer natural / google / siri / high-quality voices if available
  const match = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase())
    || voices.find(v => v.lang.toLowerCase().startsWith(targetPrefix))
    || voices.find(v => v.lang.toLowerCase().startsWith("en-in"))
    || voices.find(v => v.lang.toLowerCase().startsWith("en"));

  if (match) {
    voiceCache.set(langCode, match);
    return match;
  }
  return null;
}

// Generate spoken natural language summary
export function buildSpokenSummary(
  language: Language,
  ingredientNames: string[],
  totalCount: number,
  safetyScore?: number
): string {
  const top = ingredientNames.slice(0, 5).join(", ");
  const scorePhrase = safetyScore !== undefined ? safetyScore : null;

  switch (language) {
    case "తెలుగు":
      return scorePhrase !== null
        ? `న్యూట్రిగార్డ్ విశ్లేషణ పూర్తయింది. భద్రతా స్కోరు 100 కి ${scorePhrase}. ఈ ఉత్పత్తిలో ${totalCount} పదార్థాలు గుర్తించబడ్డాయి. ముఖ్యమైనవి: ${top}. వివరాల కోసం కింద చూడండి.`
        : `న్యూట్రిగార్డ్ విశ్లేషణ పూర్తయింది. ఈ ఉత్పత్తిలో ${totalCount} పదార్థాలు గుర్తించబడ్డాయి. ముఖ్యమైనవి: ${top}.`;
    case "हिन्दी":
      return scorePhrase !== null
        ? `न्यूट्रिगार्ड विश्लेषण पूरा हुआ। सुरक्षा स्कोर 100 में से ${scorePhrase} है। इस उत्पाद में ${totalCount} सामग्रियां पाई गई हैं। मुख्य सामग्रियां: ${top}।`
        : `न्यूट्रिगार्ड विश्लेषण पूरा हुआ। इस उत्पाद में ${totalCount} सामग्रियां पाई गई हैं। मुख्य सामग्रियां हैं: ${top}।`;
    case "தமிழ்":
      return scorePhrase !== null
        ? `பகுப்பாய்வு முடிந்தது. பாதுகாப்பு மதிப்பெண் ${scorePhrase}. இந்த தயாரிப்பில் ${totalCount} பொருட்கள் கண்டறியப்பட்டுள்ளன. முக்கியமானவை: ${top}.`
        : `பகுப்பாய்வு முடிந்தது. இந்த தயாரிப்பில் ${totalCount} பொருட்கள் கண்டறியப்பட்டுள்ளன. முக்கியமானவை: ${top}.`;
    case "ಕನ್ನಡ":
      return scorePhrase !== null
        ? `ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಸುರಕ್ಷತಾ ಸ್ಕೋರ್ ${scorePhrase}. ಈ ಉತ್ಪನ್ನದಲ್ಲಿ ${totalCount} ಪದಾರ್ಥಗಳನ್ನು ಗುರುತಿಸಲಾಗಿದೆ. ಮುಖ್ಯವಾದವು: ${top}.`
        : `ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಈ ಉತ್ಪನ್ನದಲ್ಲಿ ${totalCount} ಪದಾರ್ಥಗಳನ್ನು ಗುರುತಿಸಲಾಗಿದೆ. ಮುಖ್ಯವಾದವು: ${top}.`;
    case "മലയാളം":
      return scorePhrase !== null
        ? `വിശകലനം പൂർത്തിയായി. സുരക്ഷാ സ്കോർ ${scorePhrase}. ഈ ഉൽപ്പന്നത്തിൽ ${totalCount} ചേരുവകൾ കണ്ടെത്തി. പ്രധാനപ്പെട്ടവ: ${top}.`
        : `വിശകലനം പൂർത്തിയായി. ഈ ഉൽപ്പന്നത്തിൽ ${totalCount} ചേരുവകൾ കണ്ടെത്തി. പ്രധാനപ്പെട്ടവ: ${top}.`;
    case "मराठी":
      return scorePhrase !== null
        ? `विश्लेषण पूर्ण झाले. सुरक्षा स्कोअर ${scorePhrase}. या उत्पादनात ${totalCount} घटक आढळले आहेत. मुख्य घटक: ${top}.`
        : `विश्लेषण पूर्ण झाले. या उत्पादनात ${totalCount} घटक आढळले आहेत. मुख्य घटक: ${top}.`;
    case "বাংলা":
      return scorePhrase !== null
        ? `বিশ্লেষণ সম্পূর্ণ হয়েছে। সুরক্ষা স্কোর ${scorePhrase}। এই পণ্যে ${totalCount}টি উপাদান পাওয়া গেছে। প্রধান উপাদান: ${top}।`
        : `বিশ্লেষণ সম্পূর্ণ হয়েছে। এই পণ্যে ${totalCount}টি উপাদান পাওয়া গেছে। প্রধান উপাদান: ${top}।`;
    case "English":
    default:
      return scorePhrase !== null
        ? `NutriGuard analysis complete. Safety score is ${scorePhrase} out of 100. Identified ${totalCount} ingredients in this product including ${top}. Tap View Details to inspect regulatory evidence.`
        : `NutriGuard analysis complete. Identified ${totalCount} ingredients in this product including ${top}. Official standards and functional analysis are listed below.`;
  }
}
