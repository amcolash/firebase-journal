import React, { Component, Fragment } from 'react';
import moment from 'moment';
import Loader from 'react-loader-spinner';
import { debounce } from 'debounce';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faLongArrowAltDown } from '@fortawesome/free-solid-svg-icons';

import crypt from '../crypt';
import firebase from '../firebase';

import Button from './button';
import Footer from './footer';
import Item from './item';
import Login from './login';

import './app.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      itemList: {},
      itemTitle: '',
      itemText: '',
      selected: 0,
      saved: true,
      initialLoad: true,
      initialAuth: true,
      user: undefined,
      decryptKey: '',
      footer: {
        darkMode: true,
        simple: false,
        fullscreen: false,
        sidebar: true,
      }
    };

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
  }
  
  componentDidMount() {
    firebase.app.auth().onAuthStateChanged(u => {
      if (u) {
        this.setState({user: u, initialAuth: false}, () => {
          // Updating the `itemList` local state attribute when the Firebase Realtime Database data
          // under the '/itemList' path changes.
          this.firebaseRef = firebase.app.database().ref('/itemList');
          this.firebaseCallback = this.firebaseRef.on('value', (snap) => {
            const values = snap.val();

            if (!values) {
              this.setState({itemList: [], initialLoad: false});
              return;
            }

            const itemList = Object.entries(snap.val()).map(([key, value]) => { return {id: key, value: value}; }).sort((a, b) => {
              return b.value.created - a.value.created;
            });

            const selected = Math.min(this.state.selected, itemList.length - 1);
            const itemTitle = itemList[selected] ? itemList[selected].value.title : '';
            const itemText = itemList[selected] ? itemList[selected].value.text : '';

            this.setState({
              itemList: itemList || [],
              selected: selected || 0,
              itemTitle: itemTitle,
              itemText: itemText,
              initialLoad: false
            });
          });

          this.keyRef = firebase.app.database().ref('/key');
          this.keyCallback = this.keyRef.on('value', (snap) => {
            const val = snap.val();
            if (val) this.setState({ decryptKey: crypt.decrypt(val, u.uid) });
          });
        });
      } else {
        this.setState({user: undefined, initialAuth: false});
      }
    });
  }
  
  componentWillUnmount() {
    // Un-register the listener on '/itemList'.
    this.firebaseRef.off('value', this.firebaseCallback);
    this.keyRef.off('value', this.keyCallback);
    this.updateData.clear();
  }

  handleTitleChange(e) {
    const title = crypt.encrypt(e.target.value, this.state.decryptKey);
    this.setState({itemTitle: title, saved: false});
    this.updateData();
  }

  handleTextChange(e) {
    const text = crypt.encrypt(e.target.value, this.state.decryptKey);
    this.setState({itemText: text, saved: false});
    this.updateData();
  }
  
  updateData = debounce(() => {
    const { selected, itemList, itemTitle, itemText } = this.state;
    this.firebaseRef.child(itemList[selected].id).update({
      title: itemTitle,
      text: itemText,
      updated: new Date().getTime()
    }, err => {
      if (!err) this.setState({saved: true});
    });
  }, 1500);
  
  // This is triggered when the "Add New item" button is clicked.
  handleCreate(e) {
    if (e) e.preventDefault();
    const decryptKey = this.state.decryptKey;

    // Add the new item to Firebase.
    const now = new Date();
    const title = moment(now).format('M/D/YYYY, h:mm A');
    const text = '...';
    this.firebaseRef.push({
      created: now.getTime(),
      updated: now.getTime(),
      title: crypt.encrypt(title, decryptKey),
      text: crypt.encrypt(text, decryptKey),
    }, err => {
      if (!err) {
        this.selectItem(Math.max(0, this.state.selected - 1));
      }
    });
  }

  deleteItem(id) {
    var del = window.confirm('Are you sure you want to delete this note?');
    if (del) this.firebaseRef.child(id).remove();
  }

  selectItem(index) {
    const { selected, itemList, itemText, itemTitle, saved } = this.state;

    // Save unsaved changes on select of new item
    this.updateData.clear();
    if (!saved) {
      this.firebaseRef.child(itemList[selected].id).update({
        title: itemTitle,
        text: itemText,
        updated: new Date().getTime()
      });
    }

    this.setState({ selected: index, itemText: itemList[index].value.text, itemTitle: itemList[index].value.title, saved: true });
  }

  toggleFullscreen() {
    const footer = this.state.footer;
    if (footer.fullscreen) document.exitFullscreen();
    else document.documentElement.requestFullscreen();

    this.setState({ footer: {...footer, fullscreen: !footer.fullscreen} });
  }

  render() {
    const { initialLoad, saved, selected, itemList, footer, user, initialAuth, decryptKey } = this.state;
    const itemTitle = user ? crypt.decrypt(this.state.itemTitle, decryptKey) : '';
    const itemText = user ? crypt.decrypt(this.state.itemText, decryptKey) : '';

    return (
      <div className={"app" + (footer.darkMode ? "" : " inverted") + (!user || initialAuth || initialLoad ? " center" : "")}>
        {!user && !initialAuth ? (
          <Login /> 
        ) : (
          initialAuth || initialLoad ? (
            <Loader type="Triangle" color="#ccc" height="80" width="80" />
          ) : (
            <Fragment>
              {itemList.length === 0 ? (
                <div className="noNotes">
                  <h2>
                    You don't have any notes yet.
                    <br/>
                    Click the plus button to get started.
                  </h2>
                  <FontAwesomeIcon icon={faLongArrowAltDown} className="arrow" />
                </div>
              ) : (
                <Fragment>
                  <div className={"column left" + (footer.sidebar ? "" : " collapsed")}>
                    <div className="dates">
                      {itemList ? Object.entries(itemList).map(([index, item]) => {
                        index = Number.parseInt(index);
                        return (
                          <Item
                            index={index} key={index}
                            selected={selected}
                            item={item}
                            itemTitle={itemTitle}
                            decryptKey={decryptKey}
                            darkMode={footer.darkMode}
                            selectItem={this.selectItem}
                            deleteItem={this.deleteItem}
                          />
                        )
                      }) : null}
                    </div>
                    <Footer
                      footer={footer}
                      toggleDarkMode={() => this.setState({ footer: {...footer, darkMode: !footer.darkMode} })}
                      toggleSimpleMode={() => this.setState({ footer: {...footer, simple: !footer.simple, sidebar: !footer.simple ? false : footer.sidebar} })}
                      toggleFullscreen={this.toggleFullscreen}
                      toggleSidebar={() => this.setState({ footer: {...footer, sidebar: !footer.sidebar, simple: false} })}
                    />
                  </div>
          
                  <div className={"column right" + (footer.sidebar ? "" : " expanded") + (footer.simple ? " simple" : "")}>
                    <div>
                      <h3>
                        <input className="title" type="text" value={itemTitle} onChange={this.handleTitleChange}/>
                        <FontAwesomeIcon icon={faCheck} className={"saved" + (saved ? "" : " hidden") + (footer.darkMode ? "" : " specialInverted")} />
                      </h3>
                    </div>
                    <textarea value={itemText} onChange={this.handleTextChange}/>
                  </div>
                </Fragment>
              )}
    
              <Button title="New Item" className={"circle" + (itemList.length === 0 ? " glow" : "")} onClick={this.handleCreate}>
                <FontAwesomeIcon icon={faPlus}/>
              </Button>
            </Fragment>
          )
        )}
      </div>
    );
  }
}

export default App;
