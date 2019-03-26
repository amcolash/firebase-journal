import React, { Component, Fragment } from 'react';
import moment from 'moment';
import Loader from 'react-loader-spinner';
import { debounce } from 'debounce';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import crypt from '../crypt';
import firebase from '../firebase';

import Button from './button';
import Editor from './editor';
import Footer from './footer';
import ItemList from './itemlist';
import Login from './login';
import NoItems from './noitems';

import './app.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      initialLoad: true,
      initialAuth: true,
      user: undefined,
      decryptKey: '',
      itemList: [],
      item: {
        selected: 0,
        itemTitle: '',
        itemText: '',
        saved: true,
      },
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

            const selected = Math.min(this.state.item.selected, itemList.length - 1);
            const itemTitle = itemList[selected] ? itemList[selected].value.title : '';
            const itemText = itemList[selected] ? itemList[selected].value.text : '';

            this.setState({
              initialLoad: false,
              itemList: itemList || [],
              item: {
                saved: true,
                selected: selected || 0,
                itemTitle: itemTitle,
                itemText: itemText,
              }
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
    const {decryptKey, item} = this.state;
    const title = crypt.encrypt(e.target.value, decryptKey);
    this.setState({ item: {...item, itemTitle: title, saved: false} });
    this.updateData();
  }

  handleTextChange(e) {
    const {decryptKey, item} = this.state;
    const text = crypt.encrypt(e.target.value, decryptKey);
    this.setState({ item: {...item, itemText: text, saved: false} });
    this.updateData();
  }
  
  updateData = debounce(() => {
    const { item, itemList } = this.state;
    this.firebaseRef.child(itemList[item.selected].id).update({
      title: item.itemTitle,
      text: item.itemText,
      updated: new Date().getTime()
    }, err => {
      if (!err) this.setState({ item: {...item, saved: true} });
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
        this.selectItem(Math.max(0, this.state.item.selected - 1));
      }
    });
  }

  deleteItem(id) {
    var del = window.confirm('Are you sure you want to delete this note?');
    if (del) this.firebaseRef.child(id).remove();
  }

  selectItem(index) {
    const { item, itemList } = this.state;

    // Save unsaved changes on select of new item
    this.updateData.clear();
    if (!item.saved) {
      this.firebaseRef.child(itemList[item.selected].id).update({
        title: item.itemTitle,
        text: item.itemText,
        updated: new Date().getTime()
      });
    }

    this.setState({ item: {selected: index, itemText: itemList[index].value.text, itemTitle: itemList[index].value.title, saved: true} });
  }

  toggleFullscreen() {
    const footer = this.state.footer;
    if (footer.fullscreen) document.exitFullscreen();
    else document.documentElement.requestFullscreen();

    this.setState({ footer: {...footer, fullscreen: !footer.fullscreen} });
  }

  render() {
    const { initialLoad, item, itemList, footer, user, initialAuth, decryptKey } = this.state;

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
                <NoItems />
              ) : (
                <Fragment>
                  <div className={"column left" + (footer.sidebar ? "" : " collapsed")}>
                    <ItemList
                      decryptKey={decryptKey}
                      item={item}
                      footer={footer}
                      itemList={itemList}
                      selectItem={this.selectItem}
                      deleteItem={this.deleteItem}
                    />

                    <Footer
                      footer={footer}
                      toggleDarkMode={() => this.setState({ footer: {...footer, darkMode: !footer.darkMode} })}
                      toggleSimpleMode={() => this.setState({ footer: {...footer, simple: !footer.simple, sidebar: !footer.simple ? false : footer.sidebar} })}
                      toggleFullscreen={this.toggleFullscreen}
                      toggleSidebar={() => this.setState({ footer: {...footer, sidebar: !footer.sidebar, simple: false} })}
                    />
                  </div>
          
                  <Editor
                    decryptKey={decryptKey}
                    item={item}
                    footer={footer}
                    handleTextChange={this.handleTextChange}
                    handleTitleChange={this.handleTitleChange}
                  />
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
