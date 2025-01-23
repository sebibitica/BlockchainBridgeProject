import { useState, useEffect } from 'react';

type QuizProps = {
  chain: 'SUI' | 'ETH';
  ethAddress: string;
  suiAddress: string;
  onComplete: () => void;
  onClose: () => void;
};

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const Quiz = ({ chain, ethAddress, suiAddress, onComplete, onClose }: QuizProps) => {
  const [answers, setAnswers] = useState(['', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<{ question: string; answer: string }[]>([]);

  const allQuestions = [
    { question: '2 + 2 = ?', answer: '4' },
    { question: '3 × 5 = ?', answer: '15' },
    { question: '10 - 7 = ?', answer: '3' },
    { question: '8 ÷ 2 = ?', answer: '4' },
    { question: '7 × 3 = ?', answer: '21' },
    { question: '15 - 9 = ?', answer: '6' },
    { question: '5² = ?', answer: '25' },
    { question: '9 × 4 = ?', answer: '36' },
    { question: '100 ÷ 25 = ?', answer: '4' },
    { question: '12 - 8 = ?', answer: '4' },
    { question: '6 × 6 = ?', answer: '36' },
    { question: '20 ÷ 5 = ?', answer: '4' },
    { question: '7² = ?', answer: '49' },
    { question: '8 × 5 = ?', answer: '40' },
    { question: '81 ÷ 9 = ?', answer: '9' },
    { question: '14 - 6 = ?', answer: '8' },
    { question: '9 × 9 = ?', answer: '81' },
    { question: '25 ÷ 5 = ?', answer: '5' },
    { question: '10 - 3 = ?', answer: '7' },
    { question: '4 × 4 = ?', answer: '16' },
  ];

  // 3 random questions
  useEffect(() => {
    const shuffled = shuffleArray([...allQuestions]);
    setSelectedQuestions(shuffled.slice(0, 3));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const allCorrect = selectedQuestions.every((q, i) => 
        answers[i].trim() === q.answer
      );

      if (!allCorrect) {
        setMessage('Some answers are incorrect. Please try again!');
        return;
      }

      const address = chain === 'SUI' ? suiAddress : ethAddress;
      if (!address) throw new Error('Wallet not connected');

      const response = await fetch(`http://localhost:3000/api/${chain.toLowerCase()}/mint`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key':'secret'
        },
        body: JSON.stringify({
          address: address,
          amount: '100'
        })
      });

      if (!response.ok) throw new Error('Minting failed');
      
      alert('Success! 100 SEB tokens minted to your wallet!');
      setMessage('Success! 100 SEB tokens minted to your wallet!');
      onComplete();
    } catch (error) {
      console.error(error);
      alert('Minting failed. Please try again.');
      setMessage(error instanceof Error ? error.message : 'Minting failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quiz-modal">
      <div className="quiz-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h3>Answer 3 simple questions to get SEB tokens</h3>
        
        <form onSubmit={handleSubmit}>
          {selectedQuestions.map((q, i) => (
            <div key={i} className="question-item">
              <label>{q.question}</label>
              <input
                type="number"
                value={answers[i]}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[i] = e.target.value;
                  setAnswers(newAnswers);
                }}
                required
              />
            </div>
          ))}
          
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Answers'}
          </button>
        </form>

        {message && <div className="quiz-message">{message}</div>}
      </div>
    </div>
  );
};

export default Quiz;