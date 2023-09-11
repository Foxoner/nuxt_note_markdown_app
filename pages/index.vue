<template>
  <div class="page-wrapper flex  min-h-screen ">
    <aside class="w-[30%] border-r-2 ">
      <div class="aside-nav w-full p-5">
        <Icon class="icon mr-5" name="circum:circle-plus" color="black" size="20px" />
        <Icon @click="deleteNote(activeNoteCardIndex)" class="icon" name="circum:trash" color="black" size="20px" />
      </div>
      <div class="aside-body p-2">
        <div 
          class="w-full border-b p-2 rounded-md hover:bg-slate-100 transition" 
          :class="{'activeNote': index === activeNoteCardIndex}"
          v-for="(note, index) in filteredNotes" 
          :key="note.date" 
          @click="activeNoteCardIndex = index"
        >
          <p class="card-title truncate">{{ note.text.split('\n')[0] }}</p>
          <div class="card-info flex gap-2">
            <p class="time">{{ new Date(note.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }}</p>
            <p class="content truncate">{{ note.text.split('\n')[1] || 'No additional text' }}</p>
          </div>
        </div>
      </div>
    </aside>
    <section class="w-[70%] ">
      <div class="section-nav w-full p-5 flex justify-between items-center">
        <Icon class="icon" name="circum:edit" color="black" size="20px" />
        <div class="searchbar relative flex items-center">
          <input v-model="searchInput" class="rounded-md max-w-[150px] sm:max-w-[250px] sm: pl-8 pl-6 pr-2 py-1 border" type="text">
          <Icon class="icon absolute ml-1" name="circum:search" color="black" size="20px" />
        </div>
      </div>
      <div class="note-body">
        <div v-if="activeNoteCardIndex != null" class="exist-note">
          <p class="mx-auto bg-yellow-50 rounded-full w-fit px-2 py-1 my-3">{{  new Date(notes[activeNoteCardIndex].date).toLocaleString('en-GB', { timeZone: 'UTC' }) }}</p>
          <!-- <textarea class="w-full rounded-lg outline-none p-5" v-model="notes[activeNoteCardIndex].text" placeholder="Write something..." ></textarea> -->
          <div class="m-3 p-3" v-html="testFunc"></div>
        </div>
        <div v-else class="new-note">
          <textarea class="w-full rounded-lg outline-none p-5" v-model="newNote.text" @keypress.enter.exact.prevent="addNote" placeholder="Write something..." ></textarea>
        </div>
      </div>
    </section>
  </div>
  <!-- <div>
    <textarea v-model="newNote" @keyup.enter="addNote" placeholder="Add a note..." ></textarea>
    <ul>
      <li v-for="(note, index) in notes" :key="index">
        <template v-if="!isEditing[index]">
          <span>{{ note }}</span>
          <button @click="toggleEdit(index)">Edit</button>
        </template>
        <template v-else>
          <textarea v-model="editedNotes[index]" rows="3"></textarea>
          <button @click="saveEditedNote(index)">Save</button>
          <button @click="cancelEdit(index)">Cancel</button>
        </template>
        <button @click="deleteNote(index)">Delete</button>
      </li>
    </ul>
  </div> -->
</template>

<script lang="ts" setup>

import { marked } from 'marked';
// import { saveNote, getNotes } from '@/indexeddb.ts';
  import { Note } from '../types'
  
  

  const newNote = ref<Note>({text: '', date: Date.now()});
  const notes = ref<Note[]>([]);
  const editedNotes = ref<Note[]>([]);
  const isEditing = ref<boolean[]>([]);
  const activeNoteCardIndex = ref<number | null>(null)
  let searchInput = ref<string>('')
  const test = ref('')


  marked.use({
    "async": false,
    "breaks": false,
    "extensions": null,
    "gfm": true,
    "hooks": null,
    "pedantic": false,
    "silent": false,
    "tokenizer": null,
    "walkTokens": null
  })
  const testFunc = computed(() => {
    return marked.parse(`# Marked - Markdown Parser


[Marked] lets you convert [Markdown] into HTML.  Markdown is a simple text format whose goal is to be very easy to read and write, even when not converted to HTML.  This demo page will let you type anything you like and see how it gets converted.  Live.  No more waiting around.

How To Use The Demo
-------------------

1. Type in stuff on the left.
2. See the live updates on the right.

That's it.  Pretty simple.  There's also a drop-down option above to switch between various views:

- **Preview:**  A live display of the generated HTML as it would render in a browser.
- **HTML Source:**  The generated HTML before your browser makes it pretty.
- **Lexer Data:**  What [marked] uses internally, in case you like gory stuff like this.
- **Quick Reference:**  A brief run-down of how to format things using markdown.

Why Markdown?
-------------

It's easy.  It's not overly bloated, unlike HTML.  Also, as the creator of [markdown] says,

> The overriding design goal for Markdown's
> formatting syntax is to make it as readable
> as possible. The idea is that a
> Markdown-formatted document should be
> publishable as-is, as plain text, without
> looking like it's been marked up with tags
> or formatting instructions.

Ready to start writing?  Either start changing stuff on the left or
[clear everything](/demo/?text=) with a simple click.`)
  })

  


  // Search Logic
  const searchNotes = (title: string): Note[] => {
    return notes.value.filter(note => note.text.split('\n')[0].toLowerCase().includes(title.toLowerCase()));
  }

  const filteredNotes = computed(() => {
      return searchNotes(searchInput.value);
    });

  // Main Notes Logic
  const loadNotes = async (): Promise<void> => {
    const savedNotes = await getNotes();
    console.log(savedNotes)
    setTimeout(()=> {
      notes.value = savedNotes;
      editedNotes.value = savedNotes.slice();
      isEditing.value = savedNotes.map(() => false);
      console.log(notes.value)
    }, 100)
    
  };

  onMounted(() => {
    loadNotes();
    console.log(notes.value)
  });

  const addNote = () => {
    if (newNote.value.text.trim() !== '') {
      const curNoteDate = Date.now()
      console.log(typeof curNoteDate)
      const newNoteItem = {
        text: newNote.value.text,
        date: curNoteDate
      }
      notes.value.push(newNoteItem);
      editedNotes.value.push(newNoteItem);
      isEditing.value.push(false);
      saveNotesToIndexedDB();
      newNote.value = {text: '', date: Date.now()};
    }
    console.log(notes.value)
  };

  const deleteNote = (index: number | null) => {
    if (index != null) {
      if (window.confirm("Do you really want to delete this note?")) {
        notes.value.splice(index, 1);
        editedNotes.value.splice(index, 1);
        isEditing.value.splice(index, 1);
        saveNotesToIndexedDB();
        activeNoteCardIndex.value = null;
      }
    } 
  };

  const toggleEdit = (index: number | null) => {
    if (index != null) {
      isEditing.value[index] = !isEditing.value[index];
    }
  };

  const saveEditedNote = (index: number | null) => {
    if (index != null) {
      notes.value[index] = editedNotes.value[index];
      isEditing.value[index] = false;
      saveNotesToIndexedDB();
    }
  };

  const cancelEdit = (index: number | null) => {
    if (index != null) {
      editedNotes.value[index] = notes.value[index];
      isEditing.value[index] = false;
    }
  };

  const saveNotesToIndexedDB = () => {
    saveNote(toRaw(notes.value));
  };

</script>

<style scoped>
.icon {
  cursor: pointer;
  border-radius: 5px;
}
textarea {
  height: calc(100vh - 150px) ;
  resize: none;
}
.activeNote {
  @apply bg-yellow-100;
}
</style>