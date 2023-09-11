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
          @click="onPickCard(index)"
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
        <Icon @click="toggleEdit(activeNoteCardIndex)" class="icon" name="circum:edit" color="black" size="20px" />
        <div class="searchbar relative flex items-center">
          <input v-model="searchInput" class="rounded-md max-w-[150px] sm:max-w-[250px] sm: pl-8 pl-6 pr-2 py-1 border" type="text">
          <Icon class="icon absolute ml-1" name="circum:search" color="black" size="20px" />
        </div>
      </div>
      <div class="note-body ">
        <div v-if="activeNoteCardIndex != null" class="exist-note">
          <div class="note-preview" v-if="!isEditing[activeNoteCardIndex]">
            <p class="mx-auto bg-yellow-50 rounded-full w-fit px-2 py-1 my-3">{{  new Date(notes[activeNoteCardIndex].date).toLocaleString('en-GB', { timeZone: 'UTC' }) }}</p>
            <div class="m-3 p-3 overflow-y-auto" v-html="parseMarkedText"></div>
          </div>
          <div class="note-editing" v-else>
            <p class="mx-auto bg-yellow-50 rounded-full w-fit px-2 py-1 my-3">{{  new Date(notes[activeNoteCardIndex].date).toLocaleString('en-GB', { timeZone: 'UTC' }) }}</p>
            <textarea class="w-full rounded-lg outline-none p-5" v-model="notes[activeNoteCardIndex].text" @keypress.enter.exact.prevent="saveEditedNote(activeNoteCardIndex)" placeholder="Write something..." ></textarea>
          </div>
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


  // Marked Functional
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
  const parseMarkedText = computed(() => {
    if (activeNoteCardIndex.value != null) {
      return marked.parse(notes.value[activeNoteCardIndex.value].text)
    }
    
  })

  // Search Logic
  const searchNotes = (title: string): Note[] => {
    return notes.value.filter(note => note.text.split('\n')[0].toLowerCase().includes(title.toLowerCase()));
  }

  const filteredNotes = computed(() => {
      return searchNotes(searchInput.value);
    });

  // Pick Card Logic
  const onPickCard = (index: number): void => {
    if (activeNoteCardIndex.value != null) {
      isEditing.value[activeNoteCardIndex.value] = false;
    }
    activeNoteCardIndex.value = index;
  }
  
  // Main Notes Logic
  const loadNotes = async (): Promise<void> => {
    const savedNotes = await getNotes();
    setTimeout(()=> {
      notes.value = savedNotes;
      editedNotes.value = savedNotes.slice();
      isEditing.value = savedNotes.map(() => false);
    }, 100)
    
  };

  onMounted(() => {
    loadNotes();
  });

  const createNote = (): void => {
    if (activeNoteCardIndex.value != null &&  isEditing.value[activeNoteCardIndex.value] ) {
      saveEditedNote(activeNoteCardIndex.value)
      isEditing.value[activeNoteCardIndex.value] = false;
      activeNoteCardIndex.value = null;
    }
    activeNoteCardIndex.value = null;

  }

  const addNote = () => {
    if (newNote.value.text.trim() !== '') {
      const curNoteDate = Date.now()
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

  const saveEditedNote = ( index: number | null ) => {
    if (index != null) {
      notes.value[index] = editedNotes.value[index];
      isEditing.value[index] = false;
      saveNotesToIndexedDB();
    }
  };

  // const cancelEdit = (index: number | null) => {
  //   if (index != null) {
  //     editedNotes.value[index] = notes.value[index];
  //     isEditing.value[index] = false;
  //   }
  // };

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