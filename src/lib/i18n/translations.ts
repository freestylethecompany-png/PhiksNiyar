export type Language = 'en' | 'te';

export interface Translations {
  brandName: string;
  brandTelugu: string;
  brandTagline: string;
  liveBadge: string;
  activeProsCount: string;
  emergencyTitle: string;
  emergencySubtitle: string;
  emergencyAction: string;

  // Nav
  customerRole: string;
  providerRole: string;
  adminRole: string;
  joinAsPro: string;
  login: string;
  logout: string;
  switchAccount: string;
  myBookings: string;
  discoverAndBook: string;

  // Hero
  heroTag: string;
  heroTitleMain: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  voiceTooltip: string;
  voiceListening: string;
  findExpertBtn: string;
  analyzingText: string;
  tryAsking: string;

  // Trust badges
  trustAadhaarTitle: string;
  trustAadhaarDesc: string;
  trustArrivalTitle: string;
  trustArrivalDesc: string;
  trustPriceTitle: string;
  trustPriceDesc: string;
  trustGuaranteeTitle: string;
  trustGuaranteeDesc: string;

  // Categories
  popularServicesTitle: string;
  popularServicesSubtitle: string;
  viewAllCategories: string;

  // Providers list
  matchedProsTitle: string;
  sortedByMatch: string;
  bookNowBtn: string;
  viewReviewsBtn: string;
  visitingChargeLabel: string;
  verifiedPartnerBadge: string;
  matchScoreLabel: string;
  experienceYearsLabel: string;
  reviewsCountLabel: string;

  // Booking Modal
  bookDoorstepTitle: string;
  selectDateLabel: string;
  selectTimeLabel: string;
  doorstepAddressLabel: string;
  problemNotesLabel: string;
  visitingChargeNotice: string;
  confirmBookingBtn: string;
  submittingBookingBtn: string;

  // Statuses
  statusRequested: string;
  statusAccepted: string;
  statusOnTheWay: string;
  statusArrived: string;
  statusInProgress: string;
  statusPaymentPending: string;
  statusPaid: string;
  statusCompleted: string;
  statusCancelled: string;

  // Active bookings
  noBookingsTitle: string;
  noBookingsDesc: string;
  signInToTrack: string;
  signInToTrackDesc: string;
  liveChatBtn: string;
  whatsAppChatBtn: string;
  payUpiBtn: string;
  rateServiceBtn: string;
  cancelBookingBtn: string;

  // Footer
  footerDesc: string;
  helpdeskLabel: string;
  termsLink: string;
  privacyLink: string;
  complianceNotice: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    brandName: 'FixNear',
    brandTelugu: 'ఫిక్స్‌నియర్',
    brandTagline: 'Local help. Right when you need it.',
    liveBadge: '● LIVE IN CHILAKALURIPET',
    activeProsCount: '32+ Verified Local Pros Active Now',
    emergencyTitle: 'Emergency Repair in 30 Mins?',
    emergencySubtitle: 'Short circuit, water tank overflow, AC gas leak or bike breakdown in Chilakaluripet',
    emergencyAction: 'Get Urgent Expert',

    customerRole: 'Customer',
    providerRole: 'Service Partner',
    adminRole: 'Admin Console',
    joinAsPro: 'Join as Pro',
    login: 'Login / Sign In',
    logout: 'Logout',
    switchAccount: 'Switch Account',
    myBookings: 'My Bookings',
    discoverAndBook: 'Discover & Book',

    heroTag: 'AI Hyperlocal Assistance in Chilakaluripet, AP',
    heroTitleMain: 'Tell Us What You Need.',
    heroTitleAccent: 'AI Finds The Right Local Expert.',
    heroSubtitle: 'Speak or type in Telugu, Tanglish, or English. FixNear instantly connects you with verified local technicians across Kalamandir Center, Clock Tower, Pandaripuram, and surrounding areas.',
    searchPlaceholder: 'What service do you need? e.g. "Na AC cooling sariga ledu, evaraina ravacha?"',
    voiceTooltip: 'Click to Speak (Telugu / English)',
    voiceListening: 'Listening to your voice... Speak your problem in Telugu or English',
    findExpertBtn: 'Find Expert',
    analyzingText: 'AI Matching...',
    tryAsking: 'Popular in Chilakaluripet:',

    trustAadhaarTitle: '100% Aadhaar Verified',
    trustAadhaarDesc: 'Government ID & trade skills inspected by FixNear team.',
    trustArrivalTitle: '30-Min Fast Arrival',
    trustArrivalDesc: 'Neighborhood technicians living right within Chilakaluripet.',
    trustPriceTitle: 'Upfront Fixed Pricing',
    trustPriceDesc: 'Standard rate card from ₹149. Zero surprise quotes, zero booking fee.',
    trustGuaranteeTitle: '7-Day Free Rework',
    trustGuaranteeDesc: 'Free resolution guarantee if repair isn’t 100% satisfactory.',

    popularServicesTitle: 'Popular Local Doorstep Services',
    popularServicesSubtitle: 'Select a verified trade category in Chilakaluripet',
    viewAllCategories: 'Browse All Categories',

    matchedProsTitle: 'Verified Service Partners Nearby',
    sortedByMatch: 'Ranked by AI 10-Factor Score (Proximity + Availability + Rating)',
    bookNowBtn: 'Book Now',
    viewReviewsBtn: 'Reviews',
    visitingChargeLabel: 'Visiting Charge',
    verifiedPartnerBadge: 'FixNear Verified',
    matchScoreLabel: 'Match Score',
    experienceYearsLabel: 'yrs exp',
    reviewsCountLabel: 'reviews',

    bookDoorstepTitle: 'Book Doorstep Service',
    selectDateLabel: 'Preferred Service Date',
    selectTimeLabel: 'Preferred Time Slot',
    doorstepAddressLabel: 'Doorstep Address in Chilakaluripet',
    problemNotesLabel: 'Problem Description / Symptoms',
    visitingChargeNotice: 'Standard visiting charge payable directly to provider upon inspection. Adjusted against final repair bill.',
    confirmBookingBtn: 'Send Booking Request',
    submittingBookingBtn: 'Dispatching Request...',

    statusRequested: 'Request Sent',
    statusAccepted: 'Accepted',
    statusOnTheWay: 'On The Way',
    statusArrived: 'Arrived at Doorstep',
    statusInProgress: 'Work In Progress',
    statusPaymentPending: 'Payment Pending',
    statusPaid: 'Paid via UPI',
    statusCompleted: 'Service Completed',
    statusCancelled: 'Cancelled',

    noBookingsTitle: 'No Active Service Bookings',
    noBookingsDesc: 'When you request an AC technician, electrician, plumber, or mechanic in Chilakaluripet, your live status tracking will show here.',
    signInToTrack: 'Sign In to Track Bookings',
    signInToTrackDesc: 'Sign in with your mobile number via 6-digit OTP to view active job progress, chat with your technician, and make direct UPI payments.',
    liveChatBtn: 'Live Chat',
    whatsAppChatBtn: 'WhatsApp',
    payUpiBtn: 'Pay via UPI / QR',
    rateServiceBtn: 'Rate & Review',
    cancelBookingBtn: 'Cancel',

    footerDesc: 'FixNear (ఫిక్స్‌నియర్) is Bharat’s AI-powered local marketplace connecting households with verified local trade professionals across Chilakaluripet, Palnadu District, Andhra Pradesh.',
    helpdeskLabel: 'Local Helpdesk',
    termsLink: 'Terms of Service',
    privacyLink: 'Privacy Policy',
    complianceNotice: 'Platform Facilitator Disclaimer: FixNear Technologies connects verified local service professionals. 100% compliant with Consumer Protection (E-Commerce) Rules, 2020.',
  },
  te: {
    brandName: 'ఫిక్స్‌నియర్',
    brandTelugu: 'FixNear',
    brandTagline: 'లోకల్ సాయం. మీకు అవసరమైనప్పుడే.',
    liveBadge: '● ప్రత్యక్షంగా చిలకలూరిపేటలో',
    activeProsCount: '32+ వెరిఫైడ్ నిపుణులు ప్రస్తుతం అందుబాటులో ఉన్నారు',
    emergencyTitle: '30 నిమిషాల్లో అత్యవసర రిపేర్ కావాలా?',
    emergencySubtitle: 'షార్ట్ సర్క్యూట్, నీటి ట్యాంక్ లీకేజ్, AC గ్యాస్ లీక్ లేదా బైక్ బ్రేక్‌డౌన్',
    emergencyAction: 'అత్యవసర నిపుణుడిని పిలవండి',

    customerRole: 'కస్టమర్',
    providerRole: 'సర్వీస్ ప్రొవైడర్',
    adminRole: 'అడ్మిన్ కన్సోల్',
    joinAsPro: 'పార్టనర్‌గా చేరండి',
    login: 'లాగిన్ / సైన్ ఇన్',
    logout: 'లాగౌట్',
    switchAccount: 'ఖాతా మార్చండి',
    myBookings: 'నా బుకింగ్స్',
    discoverAndBook: 'సర్వీసులు & బుకింగ్',

    heroTag: 'చిలకలూరిపేట AI లోకల్ సర్వీస్ అసిస్టెంట్',
    heroTitleMain: 'మీ సమస్య ఏమిటో చెప్పండి.',
    heroTitleAccent: 'సరైన నిపుణుడిని AI జతచేస్తుంది.',
    heroSubtitle: 'తెలుగులో లేదా ఇంగ్లీషులో మాట్లాడండి లేదా టైప్ చేయండి. కళామందిర్ సెంటర్, గడియార స్తంభం, పండరీపురం మరియు చిలకలూరిపేటలోని వెరిఫైడ్ టెక్నీషియన్లను ఫిక్స్‌నియర్ (FixNear) క్షణాల్లో కలుపుతుంది.',
    searchPlaceholder: 'మీకు కావలసిన సర్వీస్... ఉదా: "మా AC కూలింగ్ సరిగ్గా లేదు, ఈరోజు సాయంత్రం ఎవరైనా రాగలరా?"',
    voiceTooltip: 'మాట్లాడటానికి నొక్కండి (తెలుగు / English)',
    voiceListening: 'మీ వాయిస్ వింటున్నాము... మీ సమస్యను తెలుగులో చెప్పండి',
    findExpertBtn: 'నిపుణుడిని వెతకండి',
    analyzingText: 'AI వెతుకుతోంది...',
    tryAsking: 'చిలకలూరిపేటలో ఎక్కువగా అడిగేవి:',

    trustAadhaarTitle: '100% ఆధార్ వెరిఫైడ్',
    trustAadhaarDesc: 'ప్రభుత్వ గుర్తింపు కార్డు మరియు నైపుణ్యాలను FixNear టీమ్ తనిఖీ చేసింది.',
    trustArrivalTitle: '30 నిమిషాల్లో రాక',
    trustArrivalDesc: 'చిలకలూరిపేట స్థానిక ఏరియాల్లోనే ఉండే దగ్గరి నిపుణులు.',
    trustPriceTitle: 'ముందే తెలిసిన స్పష్టమైన ధర',
    trustPriceDesc: 'విజిటింగ్ ఛార్జ్ ₹149 నుండి మొదలు. అదనపు హిడెన్ ఛార్జీలు లేవు.',
    trustGuaranteeTitle: '7-రోజుల ఉచిత రీవర్క్ వారంటీ',
    trustGuaranteeDesc: 'పనిలో ఏమైనా లోపం ఉంటే 7 రోజుల్లో ఉచితంగా మళ్లీ చేసిస్తారు.',

    popularServicesTitle: 'ప్రముఖ స్థానిక సర్వీసులు',
    popularServicesSubtitle: 'చిలకలూరిపేటలో మీకు కావలసిన కేటగిరీని ఎంచుకోండి',
    viewAllCategories: 'అన్ని కేటగిరీలు చూడండి',

    matchedProsTitle: 'మీ దగ్గరలోని వెరిఫైడ్ టెక్నీషియన్లు',
    sortedByMatch: 'AI 10-ఫ్యాక్టర్ స్కోర్ ఆధారంగా (దూరం + లభ్యత + రేటింగ్)',
    bookNowBtn: 'ఇప్పుడే బుక్ చేయండి',
    viewReviewsBtn: 'సమీక్షలు',
    visitingChargeLabel: 'విజిటింగ్ ఛార్జీ',
    verifiedPartnerBadge: 'FixNear వెరిఫైడ్',
    matchScoreLabel: 'మ్యాచ్ స్కోర్',
    experienceYearsLabel: 'సంవత్సరాల అనుభవం',
    reviewsCountLabel: 'సమీక్షలు',

    bookDoorstepTitle: 'ఇంటి వద్ద సర్వీస్ బుకింగ్',
    selectDateLabel: 'సర్వీస్ తేదీ',
    selectTimeLabel: 'సమయం',
    doorstepAddressLabel: 'చిలకలూరిపేటలో మీ చిరునామా',
    problemNotesLabel: 'సమస్య వివరాలు',
    visitingChargeNotice: 'పరీక్షించిన తర్వాత విజిటింగ్ ఛార్జ్ నేరుగా ప్రొవైడర్‌కు చెల్లించవచ్చు. ఇది ఆఖరి బిల్లులో సర్దుబాటు చేయబడుతుంది.',
    confirmBookingBtn: 'బుకింగ్ అభ్యర్థన పంపండి',
    submittingBookingBtn: 'అభ్యర్థన పంపుతున్నాము...',

    statusRequested: 'అభ్యర్థన పంపబడింది',
    statusAccepted: 'అంగీకరించబడింది',
    statusOnTheWay: 'దారిలో ఉన్నారు',
    statusArrived: 'ఇంటి వద్దకు వచ్చారు',
    statusInProgress: 'పని జరుగుతోంది',
    statusPaymentPending: 'చెల్లింపు వేచి ఉంది',
    statusPaid: 'UPI ద్వారా చెల్లించబడింది',
    statusCompleted: 'పని పూర్తయింది',
    statusCancelled: 'రద్దు చేయబడింది',

    noBookingsTitle: 'ప్రస్తుతం యాక్టివ్ బుకింగ్స్ లేవు',
    noBookingsDesc: 'మీరు AC టెక్నీషియన్, ఎలక్ట్రీషియన్, ప్లంబర్ లేదా మెకానిక్‌ను బుక్ చేసుకున్నప్పుడు, వారి లైవ్ స్టేటస్ ఇక్కడ కనిపిస్తుంది.',
    signInToTrack: 'బుకింగ్స్ చూడటానికి లాగిన్ అవ్వండి',
    signInToTrackDesc: 'మీ ఫోన్ నంబర్‌తో 6 అంకెల OTP ద్వారా లాగిన్ అయ్యి పని పురోగతిని చూడండి, టెక్నీషియన్‌తో చాట్ చేయండి, UPI ద్వారా చెల్లించండి.',
    liveChatBtn: 'లైవ్ చాట్',
    whatsAppChatBtn: 'వాట్సాప్',
    payUpiBtn: 'UPI / QR చెల్లింపు',
    rateServiceBtn: 'రేటింగ్ & రివ్యూ',
    cancelBookingBtn: 'రద్దు చేయండి',

    footerDesc: 'ఫిక్స్‌నియర్ (FixNear) చిలకలూరిపేట, పల్నాడు జిల్లా ప్రజలకు నమ్మకమైన స్థానిక టెక్నీషియన్లను క్షణాల్లో అనుసంధానించే అధునాతన AI ప్లాట్‌ఫామ్.',
    helpdeskLabel: 'స్థానిక హెల్ప్‌డెస్క్',
    termsLink: 'నిబంధనలు',
    privacyLink: 'గోప్యతా విధానం',
    complianceNotice: 'ప్లాట్‌ఫామ్ డిస్క్లైమర్: FixNear స్థానిక ప్రొఫెషనల్స్‌ను కస్టమర్లతో కలుపుతుంది. వినియోగదారుల రక్షణ నిబంధనలకు 100% కట్టుబడి ఉంది.',
  },
};
