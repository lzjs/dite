import React from 'react';

const Home = () => {
  const onClick = () => {
    console.log(1);
  };
  return (
    <div>
      <button onClick={onClick} type="button">
        Hello World!
      </button>
    </div>
  );
};

export default Home;
