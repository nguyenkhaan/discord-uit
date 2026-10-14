import Logo from '@/assets/images/Logo.webp';

interface AuthHeaderProps {
  title?: string;
  icon?: React.ReactNode;
}

export const AuthHeader = ({ title, icon }: AuthHeaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 mb-6">
      <div className="flex items-center space-x-2">
        <img src={Logo} alt="UIT Connect Logo" className="h-8 w-auto" />
        <span className="text-xl font-bold text-blue-600">UIT Connect</span>
      </div>
      {icon && (
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
          {icon}
        </div>
      )}
      {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
    </div>
  );
};