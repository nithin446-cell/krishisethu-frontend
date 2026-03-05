import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'kn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Common
    'common.continue': 'Continue',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Navigation
    'nav.home': 'Home',
    'nav.market': 'Market',
    'nav.traders': 'Traders',
    'nav.sell': 'Sell',
    'nav.buy': 'Buy',
    'nav.chat': 'Chat',
    'nav.profile': 'Profile',
    'nav.verification': 'Verification',
    'nav.disputes': 'Disputes',
    'nav.prices': 'Prices',
    'nav.schemes': 'Schemes',
    
    // Auth
    'auth.enterMobile': 'Enter Mobile Number',
    'auth.verifyOtp': 'Verify OTP',
    'auth.selectRole': 'Select Your Role',
    'auth.farmer': 'I am a Farmer',
    'auth.trader': 'I am a Trader',
    'auth.sendOtp': 'Send OTP',
    'auth.verifyOtpBtn': 'Verify OTP',
    'auth.resendOtp': 'Resend OTP',
    'auth.farmerDesc': 'Sell your produce directly',
    'auth.traderDesc': 'Buy produce from farmers',
    
    // Dashboard
    'dashboard.welcome': 'Welcome Farmer!',
    'dashboard.welcomeTrader': 'Welcome Trader!',
    'dashboard.activeProducts': 'Active Products',
    'dashboard.newBids': 'New Bids',
    'dashboard.availableProduce': 'Available Produce',
    'dashboard.activeBids': 'Active Bids',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.sellProduce': 'Sell Produce',
    'dashboard.marketPrices': 'Market Prices',
    'dashboard.schemes': 'Schemes',
    'dashboard.todayPrices': 'Today\'s Market Prices',
    'dashboard.myListedProduce': 'My Listed Produce',
    'dashboard.recentActivity': 'Recent Activity',
    
    // Market
    'market.title': 'Market Prices',
    'market.liveTitle': 'Live Market Prices',
    'market.searchPlaceholder': 'Search crops or mandi',
    'market.rising': 'Rising',
    'market.falling': 'Falling',
    'market.stable': 'Stable',
    'market.list': 'List',
    'market.compare': 'Compare',
    'market.highest': 'Highest',
    'market.average': 'Average',
    'market.lowest': 'Lowest',
    'market.mandiPrices': 'Mandi-wise Prices',
    
    // Add Produce
    'addProduce.title': 'Sell Your Produce',
    'addProduce.cropDetails': 'Crop Details',
    'addProduce.pricing': 'Set Your Price',
    'addProduce.locationImages': 'Location & Images',
    'addProduce.review': 'Review & Submit',
    'addProduce.cropName': 'Crop Name',
    'addProduce.variety': 'Variety',
    'addProduce.quantity': 'Quantity',
    'addProduce.minPrice': 'Minimum Price',
    'addProduce.location': 'Location',
    'addProduce.takePhoto': 'Take Photo',
    'addProduce.addToListing': 'Add to Listing',
    
    // Bidding
    'bidding.title': 'Place Your Bid',
    'bidding.currentBids': 'Current Bids',
    'bidding.placeBid': 'Place Bid',
    'bidding.bidAmount': 'Bid Amount',
    'bidding.message': 'Message (Optional)',
    'bidding.submitBid': 'Submit Bid',
    'bidding.noBids': 'No bids yet - be the first!',
    'bidding.highest': 'Highest',
    'bidding.totalBids': 'Total Bids',
    'bidding.suggestedBid': 'Suggested Bid',
    
    // Chat
    'chat.typeMessage': 'Type message...',
    'chat.online': 'Online',
    'chat.startConversation': 'Start conversation',
    'chat.quickReplies': 'Quick Replies',
    'chat.interested': 'Yes, I am interested',
    'chat.whatPrice': 'What is the price?',
    'chat.whenMeet': 'When can we meet?',
    'chat.thankYou': 'Thank you',
    'chat.okay': 'Okay',
    'chat.talkTomorrow': 'Let\'s talk tomorrow',
    
    // Profile
    'profile.title': 'Profile',
    'profile.phoneNumber': 'Phone Number',
    'profile.type': 'Type',
    'profile.farmer': 'Farmer',
    'profile.trader': 'Trader',
    'profile.verificationStatus': 'Verification Status',
    'profile.verified': 'Verified',
    'profile.notVerified': 'Not Verified',
    'profile.viewSchemes': 'View Government Schemes',
    
    // Government Schemes
    'schemes.title': 'Government Schemes',
    'schemes.searchPlaceholder': 'Search schemes',
    'schemes.eligibility': 'Eligibility',
    'schemes.benefits': 'Benefits',
    'schemes.applyNow': 'Apply Now',
    'schemes.subsidy': 'Subsidy',
    'schemes.loan': 'Loan',
    'schemes.insurance': 'Insurance',
    'schemes.training': 'Training',
    
    // Transaction
    'transaction.title': 'Transaction Tracking',
    'transaction.orderId': 'Order ID',
    'transaction.totalAmount': 'Total Amount',
    'transaction.quantity': 'Quantity',
    'transaction.progress': 'Progress',
    'transaction.pending': 'Pending',
    'transaction.confirmed': 'Confirmed',
    'transaction.inTransit': 'In Transit',
    'transaction.delivered': 'Delivered',
    'transaction.completed': 'Completed',
    'transaction.needHelp': 'Need Help?',
    'transaction.contact': 'Contact',
    
    // Language Selection
    'language.chooseLanguage': 'Choose Your Language',
    'language.voiceAssistance': 'Voice Assistance Available',
    'language.tapSpeaker': 'Tap the speaker icon for audio help',
  },
  hi: {
    // Common
    'common.continue': 'जारी रखें',
    'common.back': 'पिछला',
    'common.next': 'अगला',
    'common.previous': 'पिछला',
    'common.cancel': 'रद्द करें',
    'common.submit': 'जमा करें',
    'common.save': 'सेव करें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.search': 'खोजें',
    'common.filter': 'फिल्टर',
    'common.all': 'सभी',
    'common.yes': 'हाँ',
    'common.no': 'नहीं',
    'common.ok': 'ठीक है',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    
    // Navigation
    'nav.home': 'होम',
    'nav.market': 'बाज़ार',
    'nav.traders': 'व्यापारी',
    'nav.sell': 'बेचें',
    'nav.buy': 'खरीदें',
    'nav.chat': 'चैट',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.verification': 'सत्यापन',
    'nav.disputes': 'विवाद',
    'nav.prices': 'कीमतें',
    'nav.schemes': 'योजनाएं',
    
    // Auth
    'auth.enterMobile': 'मोबाइल नंबर दर्ज करें',
    'auth.verifyOtp': 'OTP सत्यापित करें',
    'auth.selectRole': 'अपनी भूमिका चुनें',
    'auth.farmer': 'मैं एक किसान हूं',
    'auth.trader': 'मैं एक व्यापारी हूं',
    'auth.sendOtp': 'OTP भेजें',
    'auth.verifyOtpBtn': 'OTP सत्यापित करें',
    'auth.resendOtp': 'OTP पुनः भेजें',
    'auth.farmerDesc': 'अपनी फसल सीधे बेचें',
    'auth.traderDesc': 'किसानों से फसल खरीदें',
    
    // Dashboard
    'dashboard.welcome': 'नमस्ते किसान भाई!',
    'dashboard.welcomeTrader': 'नमस्ते व्यापारी जी!',
    'dashboard.activeProducts': 'सक्रिय उत्पाद',
    'dashboard.newBids': 'नई बोलियां',
    'dashboard.availableProduce': 'उपलब्ध फसलें',
    'dashboard.activeBids': 'सक्रिय बोलियां',
    'dashboard.quickActions': 'त्वरित कार्य',
    'dashboard.sellProduce': 'फसल बेचें',
    'dashboard.marketPrices': 'मंडी भाव',
    'dashboard.schemes': 'योजनाएं',
    'dashboard.todayPrices': 'आज के बाज़ार भाव',
    'dashboard.myListedProduce': 'मेरी सूचीबद्ध फसलें',
    'dashboard.recentActivity': 'हाल की गतिविधि',
    
    // Market
    'market.title': 'मंडी भाव',
    'market.liveTitle': 'रियल टाइम कीमतें',
    'market.searchPlaceholder': 'फसल या मंडी खोजें',
    'market.rising': 'बढ़ते',
    'market.falling': 'गिरते',
    'market.stable': 'स्थिर',
    'market.list': 'सूची',
    'market.compare': 'तुलना',
    'market.highest': 'सर्वोच्च',
    'market.average': 'औसत',
    'market.lowest': 'न्यूनतम',
    'market.mandiPrices': 'मंडी-वार कीमतें',
    
    // Add Produce
    'addProduce.title': 'फसल बेचें',
    'addProduce.cropDetails': 'फसल का विवरण',
    'addProduce.pricing': 'कीमत निर्धारण',
    'addProduce.locationImages': 'स्थान और तस्वीरें',
    'addProduce.review': 'समीक्षा करें',
    'addProduce.cropName': 'फसल का नाम',
    'addProduce.variety': 'किस्म',
    'addProduce.quantity': 'मात्रा',
    'addProduce.minPrice': 'न्यूनतम कीमत',
    'addProduce.location': 'स्थान',
    'addProduce.takePhoto': 'तस्वीर लें',
    'addProduce.addToListing': 'सूची में जोड़ें',
    
    // Bidding
    'bidding.title': 'बोली लगाएं',
    'bidding.currentBids': 'वर्तमान बोलियां',
    'bidding.placeBid': 'बोली लगाएं',
    'bidding.bidAmount': 'बोली राशि',
    'bidding.message': 'संदेश (वैकल्पिक)',
    'bidding.submitBid': 'बोली जमा करें',
    'bidding.noBids': 'अभी तक कोई बोली नहीं - पहले बनें!',
    'bidding.highest': 'सर्वोच्च',
    'bidding.totalBids': 'कुल बोलियां',
    'bidding.suggestedBid': 'सुझावित बोली',
    
    // Chat
    'chat.typeMessage': 'संदेश लिखें...',
    'chat.online': 'ऑनलाइन',
    'chat.startConversation': 'बातचीत शुरू करें',
    'chat.quickReplies': 'त्वरित उत्तर',
    'chat.interested': 'हाँ, मुझे रुचि है',
    'chat.whatPrice': 'कीमत क्या है?',
    'chat.whenMeet': 'कब मिल सकते हैं?',
    'chat.thankYou': 'धन्यवाद',
    'chat.okay': 'ठीक है',
    'chat.talkTomorrow': 'कल बात करते हैं',
    
    // Profile
    'profile.title': 'प्रोफ़ाइल',
    'profile.phoneNumber': 'फ़ोन नंबर',
    'profile.type': 'प्रकार',
    'profile.farmer': 'किसान',
    'profile.trader': 'व्यापारी',
    'profile.verificationStatus': 'सत्यापन स्थिति',
    'profile.verified': 'सत्यापित',
    'profile.notVerified': 'गैर-सत्यापित',
    'profile.viewSchemes': 'सरकारी योजनाएं देखें',
    
    // Government Schemes
    'schemes.title': 'सरकारी योजनाएं',
    'schemes.searchPlaceholder': 'योजना खोजें',
    'schemes.eligibility': 'पात्रता',
    'schemes.benefits': 'लाभ',
    'schemes.applyNow': 'आवेदन करें',
    'schemes.subsidy': 'सब्सिडी',
    'schemes.loan': 'ऋण',
    'schemes.insurance': 'बीमा',
    'schemes.training': 'प्रशिक्षण',
    
    // Transaction
    'transaction.title': 'लेन-देन ट्रैकिंग',
    'transaction.orderId': 'ऑर्डर आईडी',
    'transaction.totalAmount': 'कुल राशि',
    'transaction.quantity': 'मात्रा',
    'transaction.progress': 'प्रगति',
    'transaction.pending': 'लंबित',
    'transaction.confirmed': 'पुष्ट',
    'transaction.inTransit': 'ट्रांजिट में',
    'transaction.delivered': 'डिलीवर',
    'transaction.completed': 'पूर्ण',
    'transaction.needHelp': 'सहायता चाहिए?',
    'transaction.contact': 'संपर्क करें',
    
    // Language Selection
    'language.chooseLanguage': 'अपनी भाषा चुनें',
    'language.voiceAssistance': 'आवाज सहायता उपलब्ध',
    'language.tapSpeaker': 'ऑडियो सहायता के लिए स्पीकर आइकन दबाएं',
  },
  kn: {
    // Common
    'common.continue': 'ಮುಂದುವರಿಸಿ',
    'common.back': 'ಹಿಂದೆ',
    'common.next': 'ಮುಂದೆ',
    'common.previous': 'ಹಿಂದಿನ',
    'common.cancel': 'ರದ್ದುಮಾಡಿ',
    'common.submit': 'ಸಲ್ಲಿಸಿ',
    'common.save': 'ಉಳಿಸಿ',
    'common.edit': 'ಸಂಪಾದಿಸಿ',
    'common.delete': 'ಅಳಿಸಿ',
    'common.search': 'ಹುಡುಕಿ',
    'common.filter': 'ಫಿಲ್ಟರ್',
    'common.all': 'ಎಲ್ಲಾ',
    'common.yes': 'ಹೌದು',
    'common.no': 'ಇಲ್ಲ',
    'common.ok': 'ಸರಿ',
    'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    'common.error': 'ದೋಷ',
    'common.success': 'ಯಶಸ್ಸು',
    
    // Navigation
    'nav.home': 'ಮನೆ',
    'nav.market': 'ಮಾರುಕಟ್ಟೆ',
    'nav.traders': 'ವ್ಯಾಪಾರಿಗಳು',
    'nav.sell': 'ಮಾರಾಟ',
    'nav.buy': 'ಖರೀದಿ',
    'nav.chat': 'ಚಾಟ್',
    'nav.profile': 'ಪ್ರೊಫೈಲ್',
    'nav.verification': 'ಪರಿಶೀಲನೆ',
    'nav.disputes': 'ವಿವಾದಗಳು',
    'nav.prices': 'ಬೆಲೆಗಳು',
    'nav.schemes': 'ಯೋಜನೆಗಳು',
    
    // Auth
    'auth.enterMobile': 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ',
    'auth.verifyOtp': 'OTP ಪರಿಶೀಲಿಸಿ',
    'auth.selectRole': 'ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆರಿಸಿ',
    'auth.farmer': 'ನಾನು ರೈತ',
    'auth.trader': 'ನಾನು ವ್ಯಾಪಾರಿ',
    'auth.sendOtp': 'OTP ಕಳುಹಿಸಿ',
    'auth.verifyOtpBtn': 'OTP ಪರಿಶೀಲಿಸಿ',
    'auth.resendOtp': 'OTP ಮರು ಕಳುಹಿಸಿ',
    'auth.farmerDesc': 'ನಿಮ್ಮ ಉತ್ಪನ್ನವನ್ನು ನೇರವಾಗಿ ಮಾರಿ',
    'auth.traderDesc': 'ರೈತರಿಂದ ಉತ್ಪನ್ನ ಖರೀದಿಸಿ',
    
    // Dashboard
    'dashboard.welcome': 'ನಮಸ್ಕಾರ ರೈತರೇ!',
    'dashboard.welcomeTrader': 'ನಮಸ್ಕಾರ ವ್ಯಾಪಾರಿಗಳೇ!',
    'dashboard.activeProducts': 'ಸಕ್ರಿಯ ಉತ್ಪನ್ನಗಳು',
    'dashboard.newBids': 'ಹೊಸ ಬಿಡ್‌ಗಳು',
    'dashboard.availableProduce': 'ಲಭ್ಯವಿರುವ ಉತ್ಪನ್ನ',
    'dashboard.activeBids': 'ಸಕ್ರಿಯ ಬಿಡ್‌ಗಳು',
    'dashboard.quickActions': 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',
    'dashboard.sellProduce': 'ಉತ್ಪನ್ನ ಮಾರಿ',
    'dashboard.marketPrices': 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು',
    'dashboard.schemes': 'ಯೋಜನೆಗಳು',
    'dashboard.todayPrices': 'ಇಂದಿನ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು',
    'dashboard.myListedProduce': 'ನನ್ನ ಪಟ್ಟಿ ಮಾಡಿದ ಉತ್ಪನ್ನ',
    'dashboard.recentActivity': 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ',
    
    // Market
    'market.title': 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು',
    'market.liveTitle': 'ನೇರ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು',
    'market.searchPlaceholder': 'ಬೆಳೆ ಅಥವಾ ಮಂಡಿ ಹುಡುಕಿ',
    'market.rising': 'ಏರುತ್ತಿರುವ',
    'market.falling': 'ಇಳಿಯುತ್ತಿರುವ',
    'market.stable': 'ಸ್ಥಿರ',
    'market.list': 'ಪಟ್ಟಿ',
    'market.compare': 'ಹೋಲಿಕೆ',
    'market.highest': 'ಅತ್ಯಧಿಕ',
    'market.average': 'ಸರಾಸರಿ',
    'market.lowest': 'ಕನಿಷ್ಠ',
    'market.mandiPrices': 'ಮಂಡಿ-ವಾರು ಬೆಲೆಗಳು',
    
    // Add Produce
    'addProduce.title': 'ನಿಮ್ಮ ಉತ್ಪನ್ನ ಮಾರಿ',
    'addProduce.cropDetails': 'ಬೆಳೆ ವಿವರಗಳು',
    'addProduce.pricing': 'ನಿಮ್ಮ ಬೆಲೆ ನಿಗದಿಪಡಿಸಿ',
    'addProduce.locationImages': 'ಸ್ಥಳ ಮತ್ತು ಚಿತ್ರಗಳು',
    'addProduce.review': 'ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಸಲ್ಲಿಸಿ',
    'addProduce.cropName': 'ಬೆಳೆಯ ಹೆಸರು',
    'addProduce.variety': 'ಪ್ರಭೇದ',
    'addProduce.quantity': 'ಪ್ರಮಾಣ',
    'addProduce.minPrice': 'ಕನಿಷ್ಠ ಬೆಲೆ',
    'addProduce.location': 'ಸ್ಥಳ',
    'addProduce.takePhoto': 'ಫೋಟೋ ತೆಗೆಯಿರಿ',
    'addProduce.addToListing': 'ಪಟ್ಟಿಗೆ ಸೇರಿಸಿ',
    
    // Bidding
    'bidding.title': 'ನಿಮ್ಮ ಬಿಡ್ ಇರಿಸಿ',
    'bidding.currentBids': 'ಪ್ರಸ್ತುತ ಬಿಡ್‌ಗಳು',
    'bidding.placeBid': 'ಬಿಡ್ ಇರಿಸಿ',
    'bidding.bidAmount': 'ಬಿಡ್ ಮೊತ್ತ',
    'bidding.message': 'ಸಂದೇಶ (ಐಚ್ಛಿಕ)',
    'bidding.submitBid': 'ಬಿಡ್ ಸಲ್ಲಿಸಿ',
    'bidding.noBids': 'ಇನ್ನೂ ಯಾವುದೇ ಬಿಡ್‌ಗಳಿಲ್ಲ - ಮೊದಲಿಗರಾಗಿ!',
    'bidding.highest': 'ಅತ್ಯಧಿಕ',
    'bidding.totalBids': 'ಒಟ್ಟು ಬಿಡ್‌ಗಳು',
    'bidding.suggestedBid': 'ಸೂಚಿಸಲಾದ ಬಿಡ್',
    
    // Chat
    'chat.typeMessage': 'ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ...',
    'chat.online': 'ಆನ್‌ಲೈನ್',
    'chat.startConversation': 'ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ',
    'chat.quickReplies': 'ತ್ವರಿತ ಉತ್ತರಗಳು',
    'chat.interested': 'ಹೌದು, ನನಗೆ ಆಸಕ್ತಿ ಇದೆ',
    'chat.whatPrice': 'ಬೆಲೆ ಎಷ್ಟು?',
    'chat.whenMeet': 'ಯಾವಾಗ ಭೇಟಿಯಾಗಬಹುದು?',
    'chat.thankYou': 'ಧನ್ಯವಾದಗಳು',
    'chat.okay': 'ಸರಿ',
    'chat.talkTomorrow': 'ನಾಳೆ ಮಾತನಾಡೋಣ',
    
    // Profile
    'profile.title': 'ಪ್ರೊಫೈಲ್',
    'profile.phoneNumber': 'ಫೋನ್ ಸಂಖ್ಯೆ',
    'profile.type': 'ಪ್ರಕಾರ',
    'profile.farmer': 'ರೈತ',
    'profile.trader': 'ವ್ಯಾಪಾರಿ',
    'profile.verificationStatus': 'ಪರಿಶೀಲನೆ ಸ್ಥಿತಿ',
    'profile.verified': 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    'profile.notVerified': 'ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ',
    'profile.viewSchemes': 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    
    // Government Schemes
    'schemes.title': 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು',
    'schemes.searchPlaceholder': 'ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ',
    'schemes.eligibility': 'ಅರ್ಹತೆ',
    'schemes.benefits': 'ಪ್ರಯೋಜನಗಳು',
    'schemes.applyNow': 'ಈಗ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
    'schemes.subsidy': 'ಸಬ್ಸಿಡಿ',
    'schemes.loan': 'ಸಾಲ',
    'schemes.insurance': 'ವಿಮೆ',
    'schemes.training': 'ತರಬೇತಿ',
    
    // Transaction
    'transaction.title': 'ವಹಿವಾಟು ಟ್ರ್ಯಾಕಿಂಗ್',
    'transaction.orderId': 'ಆರ್ಡರ್ ಐಡಿ',
    'transaction.totalAmount': 'ಒಟ್ಟು ಮೊತ್ತ',
    'transaction.quantity': 'ಪ್ರಮಾಣ',
    'transaction.progress': 'ಪ್ರಗತಿ',
    'transaction.pending': 'ಬಾಕಿ',
    'transaction.confirmed': 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    'transaction.inTransit': 'ಸಾಗಣೆಯಲ್ಲಿ',
    'transaction.delivered': 'ವಿತರಿಸಲಾಗಿದೆ',
    'transaction.completed': 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    'transaction.needHelp': 'ಸಹಾಯ ಬೇಕೇ?',
    'transaction.contact': 'ಸಂಪರ್ಕಿಸಿ',
    
    // Language Selection
    'language.chooseLanguage': 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    'language.voiceAssistance': 'ಧ್ವನಿ ಸಹಾಯ ಲಭ್ಯವಿದೆ',
    'language.tapSpeaker': 'ಆಡಿಯೋ ಸಹಾಯಕ್ಕಾಗಿ ಸ್ಪೀಕರ್ ಐಕಾನ್ ಟ್ಯಾಪ್ ಮಾಡಿ',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('selectedLanguage');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('selectedLanguage', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};