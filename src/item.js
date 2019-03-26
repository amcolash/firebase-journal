import React, { Component } from 'react';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import crypt from './crypt';
import Button from './button';

import './item.css';

class Item extends Component {
  render() {
    const { index, selected, item, itemTitle, decryptKey, darkMode, selectItem, deleteItem } = this.props;

    return (
      <div className="item">
        <Button className={"date"} selected={(selected === index ? " selected" : "")} onClick={() => selectItem(index)}>
          {selected === index ? itemTitle : crypt.decrypt(item.value.title, decryptKey)}
          <br/>
          <span className="updated">{moment(item.value.updated).fromNow()}</span>
        </Button>

        <Button title="Delete" className={"delete" + (darkMode ? "" : " inverted")} onClick={() => deleteItem(item.id)}>
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      </div>
    );
  }
}

export default Item;