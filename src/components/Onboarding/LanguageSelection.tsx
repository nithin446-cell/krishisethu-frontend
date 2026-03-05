import React from 'react';
import { Volume2, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageSelectionProps {
  onContinue: () => void;
}

const LanguageSelection: React.FC<LanguageSelectionProps> = ({
  onContinue
}) => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧'
    },
    {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिंदी',
      flag: '🇮🇳'
    },
    {
      code: 'kn',
      name: 'Kannada',
      nativeName: 'ಕನ್ನಡ',
      flag: '🇮🇳'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-12">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl text-white">🌐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('language.chooseLanguage')}</h2>
          <p className="text-gray-600">
            {language === 'en' && 'अपनी भाषा चुनें / ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ'}
            {language === 'hi' && 'Choose Your Language / ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ'}
            {language === 'kn' && 'Choose Your Language / अपनी भाषा चुनें'}
          </p>
        </div>

        {/* Language Options */}
        <div className="space-y-4 mb-8">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as any)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                language === lang.code
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="text-left">
                    <p className="text-lg font-semibold text-gray-800">{lang.name}</p>
                    <p className="text-sm text-gray-600">{lang.nativeName}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Voice assistance functionality would go here
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Volume2 size={20} className="text-gray-500" />
                  </button>
                  
                  {language === lang.code && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Voice Assistance Option */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <div className="flex items-center space-x-3">
            <Volume2 size={24} className="text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">{t('language.voiceAssistance')}</p>
              <p className="text-sm text-blue-600">{t('language.tapSpeaker')}</p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          disabled={!language}
          className={`w-full py-4 rounded-xl text-lg font-semibold transition-colors ${
            language
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {t('common.continue')} / {language === 'en' ? 'जारी रखें / ಮುಂದುವರಿಸಿ' : language === 'hi' ? 'Continue / ಮುಂದುವರಿಸಿ' : 'Continue / जारी रखें'}
        </button>
      </div>
    </div>
  );
};

export default LanguageSelection;