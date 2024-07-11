<script lang="ts">
    import { onMount } from "svelte";
    import { user } from "$lib/firebaseService";
    import type { CustomUser } from "$lib/firebaseService";
    import { writable, type Writable } from "svelte/store";
    import type { DocumentData } from "firebase/firestore";
    import Editor from '@tinymce/tinymce-svelte';
  
    // Your TinyMCE API key
    const apiKey = import.meta.env.VITE_TINYMCE_API_KEY;
    //console.log(apiKey);

    // Configuration options for TinyMCE
    const editorConfig = {
        plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount checklist mediaembed casechange export formatpainter pageembed linkchecker a11ychecker tinymcespellchecker permanentpen powerpaste advtable advcode editimage advtemplate ai mentions tinycomments tableofcontents footnotes mergetags autocorrect typography inlinecss markdown',
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
        tinycomments_mode: 'embedded',
        tinycomments_author: 'Author name',
        mergetags_list: [
            { value: 'First.Name', title: 'First Name' },
            { value: 'Email', title: 'Email' },
        ],
        ai_request: (request: any, respondWith: any) => respondWith.string(() => Promise.reject("See docs to implement AI Assistant")),
    };

    let userData: CustomUser | null = null;
    let shareCode: string = '';
    let classes: Writable<DocumentData[]> = writable([]);
    let journalContent: string = '';

    onMount(() => {
        user.subscribe((u) => {
            userData = u;
            if (u) {
                // Call a function to load student-specific data if necessary
            }
        });
    });

    async function submitJournal() {
        // Add form submission logic here
        console.log('Journal submitted');
    }
</script>

<h1>Student Work Journal</h1>

{#if userData}
<p>Welcome, {userData.displayName}!</p>
{:else}
<p>Welcome, student!</p>
{/if}

<form on:submit|preventDefault={submitJournal}>
    <h2>Overview</h2>
    <label for="learning">What is the most interesting, positive, or exciting thing that you learned last week?</label>
    <div id="learning">
        <input type="checkbox" id="programming" value="programming"> Programming concept<br>
        <input type="checkbox" id="hardware" value="hardware"> Hardware interaction<br>
        <input type="checkbox" id="problem-solving" value="problem-solving"> Problem-solving technique<br>
        <input type="checkbox" id="teamwork" value="teamwork"> Teamwork/Collaboration<br>
        <input type="checkbox" id="other-learning" value="other-learning"> Other<br>
    </div>
    <input type="text" id="learning-details" placeholder="Provide specific details (optional)">

    <h2>Evidence</h2>
    <label for="journal-content">Provide your evidence and reflections below:</label>
    <Editor apiKey={apiKey} bind:value={journalContent}/>

    <label for="evidence-type">What is the evidence you've provided?</label>
    <div id="evidence-type">
        <input type="checkbox" id="screenshot" value="screenshot"> Screenshot of completed task<br>
        <input type="checkbox" id="photo" value="photo"> Photo of a project<br>
        <input type="checkbox" id="code-snippet" value="code-snippet"> Code snippet<br>
        <input type="checkbox" id="diagram" value="diagram"> Diagram/Chart<br>
        <input type="checkbox" id="other-evidence" value="other-evidence"> Other<br>
    </div>
    <input type="text" id="evidence-details" placeholder="Provide specific details (optional)">

    <label for="learning-demonstrated">What learning does this evidence demonstrate? (Select all that apply)</label>
    <div id="learning-demonstrated">
        <input type="checkbox" id="understanding" value="understanding"> Understanding key concepts<br>
        <input type="checkbox" id="applying" value="applying"> Applying theory to practice<br>
        <input type="checkbox" id="solving" value="solving"> Solving complex problems<br>
        <input type="checkbox" id="collaborating" value="collaborating"> Collaborating with others<br>
    </div>
    <input type="text" id="learning-demonstrated-details" placeholder="Provide specific details (optional)">

    <label for="learning-evidence">How does this evidence demonstrate that learning?</label>
    <textarea id="learning-evidence" placeholder="Use dot points for concise reflection"></textarea>

    <h2>Reflection</h2>
    <label for="responsibility">How have you taken responsibility for your learning? (Select all that apply)</label>
    <div id="responsibility">
        <input type="checkbox" id="completed-tasks" value="completed-tasks"> Completed all tasks assigned<br>
        <input type="checkbox" id="additional-research" value="additional-research"> Did additional research<br>
        <input type="checkbox" id="sought-feedback" value="sought-feedback"> Sought feedback<br>
    </div>
    <input type="text" id="responsibility-details" placeholder="Provide specific details (optional)">

    <label for="response">How did you respond to feedback & challenges to improve learning?</label>
    <textarea id="response" placeholder="Your Answer Here"></textarea>

    <label for="engagement">How did you engage effectively in your classwork?</label>
    <textarea id="engagement" placeholder="Your Answer Here"></textarea>

    <label for="interaction">Did you interact respectfully with others? Explain your answer.</label>
    <textarea id="interaction" placeholder="Your Answer Here"></textarea>

    <button type="submit">Submit</button>
</form>

<style>
    form {
        max-width: 600px;
        margin: auto;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 8px;
        background: #f9f9f9;
    }
    label {
        display: block;
        margin-top: 1rem;
    }
    input[type="text"], input[type="file"], select, textarea {
        width: 100%;
        padding: 0.5rem;
        margin-top: 0.5rem;
    }
    textarea {
        height: 100px;
    }
    button {
        display: block;
        width: 100%;
        padding: 0.75rem;
        background-color: #007BFF;
        color: white;
        border: none;
        border-radius: 4px;
        margin-top: 1rem;
    }
</style>
