import React, { Component } from 'react';
import { debounce } from "debounce";
import firebase from './firebase.js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      todoList: {}, // Mirrors the Todo list in Firebase.
      todoText: '', // Mirrors the new Todo Text field in the UI.
      selected: 0,
      saved: true
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  
  componentDidMount() {
    // Updating the `todoList` local state attribute when the Firebase Realtime Database data
    // under the '/todoList' path changes.
    this.firebaseRef = firebase.database().ref('/todoList');
    this.firebaseCallback = this.firebaseRef.on('value', (snap) => {
      const values = snap.val();

      if (!values) {
        this.handleSubmit();
        return;
      }

      const todoList = Object.entries(snap.val()).map(([key, value]) => { return {id: key, value: value}; }).sort((a, b) => {
        return b.value.date - a.value.date;
      });

      const selected = Math.min(this.state.selected, todoList.length);
      const todoText = todoList[selected] ? todoList[selected].value.text : '';

      this.setState({ todoList: todoList || [], selected: selected || 0, todoText: todoText || '' });
    });
  }
  
  componentWillUnmount() {
    // Un-register the listener on '/todoList'.
    this.firebaseRef.off('value', this.firebaseCallback);
    this.updateData.clear();
  }

  handleChange(e) {
    this.setState({todoText: e.target.value, saved: false});
    this.updateData();
  }
  
  updateData = debounce(() => {
    const { selected, todoList, todoText } = this.state;
    this.firebaseRef.child(todoList[selected].id).update({text: todoText}, err => {
      if (!err) this.setState({saved: true});
    });
  }, 2000);
  
  // This is triggered when the "Add New Todo" button is clicked.
  handleSubmit(e) {
    if (e) e.preventDefault();
    // Add the new todo to Firebase.
    this.firebaseRef.push({
      text: 'This is a new item',
      date: new Date().getTime()
    });
  }

  delete(key) {
    this.firebaseRef.child(key).remove();
  }

  select(index) {
    this.setState({selected: index, todoText: this.state.todoList[index].value.text});
  }

  render() {
    const { saved, selected, todoList, todoText } = this.state;

    return (
      <div className="App">
        <div className="column left">
          <div className="dates">
            {todoList ? Object.entries(todoList).map(([index, item]) => {
              index = Number.parseInt(index);
              const date = new Date(item.value.date).toLocaleString();
              return <div className={"item" + (selected === index ? " selected" : "")} key={index}>
                <div className="date" onClick={() => this.select(index)}>{date}</div>
                <div className="delete" onClick={() => this.delete(item.id)}>X</div>
              </div>
            }) : null}
          </div>
        </div>

        <div className="column right">
          <textarea value={todoText} onChange={this.handleChange}/>
        </div>

        <div className={"saved" + (saved ? "" : " hidden")}>✓</div>

        <button className="button" onClick={this.handleSubmit}>+</button>
      </div>
    );
  }
}

export default App;
