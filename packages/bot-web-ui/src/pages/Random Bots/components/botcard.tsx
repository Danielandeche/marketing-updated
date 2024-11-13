import React from 'react';

interface BotCardProps {
  botName: string;
  botDescription: string;
  recommended: boolean;
  startAction: () => void;
}

const BotCard: React.FC<BotCardProps> = ({ botName, botDescription, recommended, startAction }) => {
  return (
    <div className="bot-card">
      <h2 className="bot-card-title">{botName}</h2>
      <p className="bot-card-description">{botDescription}</p>
      <div className="bot-card-actions">
        <button onClick={startAction} className="bot-card-start-button">Start</button>
        {recommended && <span className="bot-card-recommended-badge">Recommended</span>}
      </div>
    </div>
  );
};

export default BotCard;
