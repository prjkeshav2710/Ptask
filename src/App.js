import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import io from "socket.io-client";
import './App.css'; 

const App = () => {
  const phaserRef = useRef(null);
  const ballRef = useRef(null);
  const gameRef = useRef(null);
  const socketRef = useRef(null);
  const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [clickedButtons, setClickedButtons] = useState([]);
  const [lastClickedButton, setLastClickedButton] = useState(null);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  useEffect(() => {

    socketRef.current = io("http://localhost:3000/");
    socketRef.current.on("connect", () => {
      console.log("Connected to server");
    });
    socketRef.current.on("admin", () => {
      console.log("Received admin event");
      setIsAdmin(true);
    });
  
    socketRef.current.on("viewer", () => {
      console.log("Received viewer event");
      setIsAdmin(true);
    });
    const config = {
      type: Phaser.AUTO,
      width: 700,
      height: 600,
      parent: phaserRef.current,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    gameRef.current = new Phaser.Game(config);
    function preload() {
      this.load.image("ball", "ball.png");
    }
    function create() {
      socketRef.current.emit(isAdmin ? "admin" : "viewer");
      ballRef.current = this.physics.add.sprite(300, 250, "ball");
      ballRef.current.setCollideWorldBounds(true);
      ballRef.current.setBounce(1);
      ballRef.current.setInteractive();
      ballRef.current.setScale(0.3);
      this.physics.world.setBoundsCollision(true, true, true, true);
      this.physics.add.collider(
        ballRef.current,
        null,
        handleCollision,
        null,
        this
      );
    }
    function handleCollision() {}
    function update() {
      if (ballRef.current) {
        socketRef.current.emit("ballPosition", {
          x: ballRef.current.x,
          y: ballRef.current.y,
        });
    }
  }
    return () => {
      gameRef.current.destroy(true);
      socketRef.current.off("ballMoved");
      socketRef.current.disconnect();
    };
  }, [ballPosition, isAdmin]);
  useEffect(() => {
    socketRef.current.on("ballMoved", ({ x, y }) => {
      if (!isAdmin && ballRef.current) {
        const angle = Phaser.Math.Angle.Between(
          ballRef.current.x,
          ballRef.current.y,
          x,
          y
        );
        ballRef.current.setVelocity(
          Math.cos(angle) * 700, 
          Math.sin(angle) * 700  
        );
        const distance = Phaser.Math.Distance.Between(
          ballRef.current.x,
          ballRef.current.y,
          x,
          y
        );
        const duration = (distance / 700) * 1000; 
        gameRef.current.scene.scenes[0].tweens.add({
          targets: ballRef.current,
          x: x,
          y: y,
          duration: duration,
          ease: "Linear",
          onComplete: () => {
          },
        });
      }
    });
    socketRef.current.on("adminButtonClicked", (buttonName) => {
      setLastClickedButton(buttonName);
      setClickedButtons([...clickedButtons, buttonName]);
    });
  }, [isAdmin,clickedButtons]);
   const handleButtonClick = (x, y, buttonName) => {
    if (isAdmin) {
      socketRef.current.emit("ballMoved", { x, y });
      socketRef.current.emit("adminButtonClicked", buttonName);
      setLastClickedButton(buttonName);
    } else {
      socketRef.current.emit("viewerButtonClicked", { x, y });
      socketRef.current.emit("viewerButtonClicked", buttonName);
      setButtonDisabled(true); 
    }
    if (ballRef.current && isAdmin) {
      const angle = Phaser.Math.Angle.Between(
        ballRef.current.x,
        ballRef.current.y,
        x,
        y
      );
      const speed = 700;
      ballRef.current.setVelocityX(Math.cos(angle) * speed);
      ballRef.current.setVelocityY(Math.sin(angle) * speed);
    }
    setClickedButtons([...clickedButtons, buttonName]);

  }
  return (
    <><div >
    <h2 className=" text-lg font-extrabold">{isAdmin ? (
          <div>
            <p className="text-center justify-center items-center">ADMIN</p>
          </div>
        ) : (
          <div className="flex"> 
            <p className=" text-lg font-extrabold">USER</p>
            <h2>{lastClickedButton && (
            <p className="ml-96 text-lg font-extrabold">
              Clicked Button: {lastClickedButton}
            </p>
          )}</h2>
          </div>
        )}
        </h2>
          </div>
    <div className="flex items-center justify-center h-screen">
      <div className="relative w-8/12 h-5/6  flex items-center justify-center p-4">
      
        <div className="absolute left-0 flex flex-col items-center">
        <button
              onClick={() => handleButtonClick(0, 200, "Button 3")}
              className={`btn2 text-white px-4 py-2 mb-32 ${
                buttonDisabled ? "disabled" : ""
              }`}
              disabled={buttonDisabled}>
              Button 3</button>
            <button
              onClick={() => handleButtonClick(0, 400, "Button 5")}
              className={`btn2 text-white px-4 py-2 ${
                buttonDisabled ? "disabled" : ""
              }`}
              disabled={buttonDisabled}>
            Button 5</button>
            </div>
        <div className="absolute top-0 flex flex-row items-center">
          <button
            onClick={() => handleButtonClick(200, 0,"Button 1")}
            className={` text-white px-4 py-2 mr-32 ${
              buttonDisabled ? "disabled" : ""
            }`}>
            Button 1
          </button>
          <button
            onClick={() => handleButtonClick(500, 0,"Button 2")}
            className={` text-white px-4 py-2${
              buttonDisabled ? "disabled" : ""
            }`}>
          Button 2
          </button>
        </div>
        <div className="absolute right-0 flex flex-col items-center">
          <button
            onClick={() => handleButtonClick(700, 200,"Button 4")}
            className={`btn1 text-white px-4 py-2 mb-32 ${
              buttonDisabled ? "disabled" : ""
            }`}>
          Button 4
          </button>
          <button
            onClick={() => handleButtonClick(700, 400,"Button 6")}
            className={`btn1 text-white px-4 py-2 ${
              buttonDisabled ? "disabled" : ""
            }`}>
          Button 6
          </button>
        </div>
        <div className="absolute bottom-0 flex flex-row items-center">
          <button
            onClick={() => handleButtonClick(200, 600,"Button 7")}
            className={` text-white px-4 py-2 mr-32 ${
              buttonDisabled ? "disabled" : ""
            }`}>
          Button 7
          </button>
          <button
            onClick={() => handleButtonClick(450, 600,"Button 8")}
            className={` text-white px-4 py-2 ${
              buttonDisabled ? "disabled" : ""
            }`}>
          Button 8
          </button>
        </div>
        <div className="w-9/12 h-9/12 ">
          <div ref={phaserRef} />
        </div>
      </div>
    </div>
    </>
  );
};

export default App;
