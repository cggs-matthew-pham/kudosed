<script lang="ts">
    import { onMount } from "svelte";
    import { user, addItem, loadCollection, getSingleDoc, updateItem } from "$lib/firebaseService";
    import type { CustomUser } from "$lib/firebaseService";
    import { writable, type Writable } from "svelte/store";
    import type { DocumentData } from "firebase/firestore";
  
    let userData: CustomUser | null = null;
    let selfAssessment: Writable<DocumentData[]> = writable([]);
    let weeks: number[] = [1, 2, 3, 4, 5]; // Adjust the number of weeks as needed
  
    // ACARA performance criteria for Digital Technologies (Years 9-10)
    const criteria = [
      "Algorithms and Programming",
      "Data Representation",
      "User Interfaces",
      "Cyber Security",
      "Networks and System Architecture",
      "Project Management",
      "Problem Solving",
      "Collaboration",
      "Ethics and Impact",
      "Innovative Thinking"
    ];

    const criteria2 = [
      {
        name: "Algorithms and Programming",
        subcriteria: ["Input/Output", "Strings", "Loops"]
      },
      {
        name: "Data Representation",
        subcriteria: ["Binary", "Hexadecimal", "Data Structures"]
      },
      {
        name: "User Interfaces",
        subcriteria: ["Design Principles", "User Testing", "Accessibility"]
      },
      {
        name: "Cyber Security",
        subcriteria: ["Encryption", "Threat Analysis", "Security Protocols"]
      },
      {
        name: "Networks and System Architecture",
        subcriteria: ["Network Topologies", "OSI Model", "System Design"]
      },
      {
        name: "Project Management",
        subcriteria: ["Planning", "Execution", "Evaluation"]
      },
      {
        name: "Problem Solving",
        subcriteria: ["Identifying Problems", "Developing Solutions", "Testing Solutions"]
      },
      {
        name: "Collaboration",
        subcriteria: ["Team Communication", "Conflict Resolution", "Collaborative Tools"]
      },
      {
        name: "Ethics and Impact",
        subcriteria: ["Ethical Considerations", "Social Impact", "Environmental Impact"]
      },
      {
        name: "Innovative Thinking",
        subcriteria: ["Creativity", "Adaptability", "Critical Thinking"]
      }
    ];
  
    onMount(() => {
      user.subscribe((u) => {
        userData = u;
        if (u) {
          loadSelfAssessment(u.uid);
        }
      });
    });
  
    async function loadSelfAssessment(studentId: string): Promise<void> {
      try {
        const assessmentRecords: DocumentData[] = await loadCollection("selfAssessment", studentId);
        selfAssessment.set(assessmentRecords);
      } catch (error) {
        console.error('Error loading self-assessment records:', error);
      }
    }
  
    async function saveSelfAssessment() {
      try {
        const assessmentData = $selfAssessment;
        if (userData) {
          await updateItem("selfAssessment", userData.uid, { assessments: assessmentData });
          console.log('Self-assessment saved');
        }
      } catch (error) {
        console.error('Error saving self-assessment:', error);
      }
    }
  
    function updateAssessment(criterion: string, week: number, target: EventTarget) {
      const value = parseInt((target as HTMLInputElement).value, 10);
      selfAssessment.update(records => {
        const existingRecord = records.find(record => record.criterion === criterion);
        if (existingRecord) {
          existingRecord.scores[week] = value;
        } else {
          const newRecord = { criterion, scores: { [week]: value } };
          records.push(newRecord);
        }
        return records;
      });
    }
  </script>
  
  <h1>Self-Assessment</h1>
  
  {#if userData}
    <p>Welcome, {userData.displayName}!</p>
  {:else}
    <p>Welcome, student!</p>
  {/if}
  
  <form on:submit|preventDefault={saveSelfAssessment}>
    <table>
      <thead>
        <tr>
          <th>Criterion</th>
          {#each weeks as week}
            <th>Week {week}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each criteria as criterion}
          <tr>
            <td>{criterion}</td>
            {#each weeks as week}
              <td>
                <input 
                  type="number" 
                  min="0" 
                  max="5" 
                  on:input={(e) => {
                    if (e.target) {
                      updateAssessment(criterion, week, e.target);
                    }
                  }} 
                  value="0" 
                />
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    <button type="submit">Save Self-Assessment</button>
  </form>
  
  <style>
    form {
      max-width: 800px;
      margin: auto;
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 8px;
      background: #f9f9f9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 0.5rem;
      text-align: center;
    }
    th {
      background-color: #f1f1f1;
    }
    input {
      width: 60px;
      padding: 0.5rem;
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
  