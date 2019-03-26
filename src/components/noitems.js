import React, {Component} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltDown } from '@fortawesome/free-solid-svg-icons';

import './noitems.css';

class NoItems extends Component {
  render() {
    return (
      <div className="noItems">
        <h2>
          You don't have any items yet.
          <br/>
          Click the plus button to get started.
        </h2>
        <FontAwesomeIcon icon={faLongArrowAltDown} className="arrow" />
      </div>
    );
  }
}

export default NoItems;