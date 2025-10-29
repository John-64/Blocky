interface Props {
    message: string;
    type: 'success' | 'error';
}

export default function Notification({ message, type }: Props) {
    const baseClasses = "p-4 rounded-md text-white font-semibold fixed top-5 right-1/2 translate-x-1/2 z-50 shadow-lg";
    const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            {message}
        </div>
    );
}