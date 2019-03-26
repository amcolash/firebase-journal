import React, {Component} from 'react';

import crypt from '../crypt';
import Item from './item';

import './itemlist.css';

class ItemList extends Component {
  render() {
    const { decryptKey, item, footer, itemList, selectItem, deleteItem } = this.props;

    const itemTitle = decryptKey ? crypt.decrypt(item.itemTitle, decryptKey) : '';

    return (
      <div className="itemList">
        {itemList ? Object.entries(itemList).map(([index, value]) => {
          index = Number.parseInt(index);
          return (
            <Item
              index={index}
              key={index}
              selected={item.selected}
              item={value}
              itemTitle={itemTitle}
              decryptKey={decryptKey}
              darkMode={footer.darkMode}
              selectItem={selectItem}
              deleteItem={deleteItem}
            />
          )
        }) : null}
      </div>
    );
  }
}

export default ItemList;