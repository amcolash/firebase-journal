import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleLeft, faAngleDoubleRight, faExpandArrowsAlt, faCompressArrowsAlt,
faMoon, faSignOutAlt, faEye } from '@fortawesome/free-solid-svg-icons';

import firebase from '../firebase';
import Button from './button';

import './footer.css';

class Footer extends Component {
  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.footer.simple && this.props.footer.simple && document.fullscreenElement === null && window.innerWidth < 600) this.props.toggleFullscreen();
  }

  render() {
    const { footer, toggleDarkMode, toggleSimpleMode, toggleFullscreen, toggleSidebar } = this.props;

    return (
      <div className={"footer" + (!footer.sidebar ? " collapsed" : "")}>
        <Button title="Sign Out" onClick={() => firebase.app.auth().signOut()}>
          <FontAwesomeIcon icon={faSignOutAlt}/>
        </Button>

        <div className="spacer"></div>

        <Button title="Toggle Dark Mode" selected={footer.darkMode} onClick={toggleDarkMode}>
          <FontAwesomeIcon icon={faMoon}/>
        </Button>

        <Button title="Toggle Simple Mode" className="simpleMode" selected={footer.simple} onClick={toggleSimpleMode}>
          <FontAwesomeIcon icon={faEye}/>
        </Button>

        <Button title="Toggle Full Screen" className="fullscreenMode" selected={footer.fullscreen} onClick={toggleFullscreen}>
          <FontAwesomeIcon icon={footer.fullscreen ? faCompressArrowsAlt : faExpandArrowsAlt}/>
        </Button>

        <div className="spacer"></div>
        <Button title="Toggle Sidebar" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={footer.sidebar ? faAngleDoubleLeft : faAngleDoubleRight}/>
        </Button>
      </div>
    );
  }
}

export default Footer;