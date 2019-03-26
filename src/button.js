import React, { Component } from 'react';
import './button.css';

class Button extends Component {
  render() {
    const { className, title, onClick, selected, children } = this.props;

    return (
      <button
        className={"button " + className + (selected ? " selected" : "")}
        onClick={onClick}
        title={title}
      >{children}</button>
    );
  }
}

export default Button;