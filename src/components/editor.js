import React, {Component} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

import crypt from '../crypt';

import './editor.css';

class Editor extends Component {
  componentDidUpdate(prevProps, prevState) {
    if (this.props.item.focused) {
      this.textBox.focus();
    }
  }

  render() {
    const {footer, item, decryptKey, handleTextChange, handleTitleChange, isMobile} = this.props;

    const itemTitle = decryptKey ? crypt.decrypt(item.itemTitle, decryptKey) : '';
    const itemText = decryptKey ? crypt.decrypt(item.itemText, decryptKey) : '';

    return (
      <div className={"column right" + (footer.sidebar ? "" : " expanded") + (footer.simple ? " simple" : "")}>
        <div>
          <h3>
            <input className="title" type="text" value={itemTitle} onChange={handleTitleChange}/>
            <FontAwesomeIcon icon={faCheck} className={"saved" + (item.saved ? "" : " hidden") + (footer.darkMode ? "" : " specialInverted")} />
          </h3>
        </div>
        <textarea value={itemText} onChange={handleTextChange} autoFocus={!isMobile()} ref={(input) => { this.textBox = input; }} />
      </div>
    );
  }
}

export default Editor;