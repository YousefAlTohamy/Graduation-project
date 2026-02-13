export default function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-lg p-6 ${hover ? 'hover:shadow-xl transition' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
