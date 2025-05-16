# AI Content Summarizer Chrome Extension

AI Content Summarizer is a Chrome extension that summarizes the selected text in a webpage and translates it to English (if it is written in another language) using Cohere's AI

## Overview

Purpose: Quickly generate summaries (in English) of selected webpage text

✨ Key Features of the extension:

- **Right-click context menu integration**
- **Customizable summary lengths (short/medium/long)**
- **Multilingual support (output summary in English)**
- **Summary history tracking**
- **Copy/Save functionality of the generated summary**

## Installation

The extension can be installed for local development/testing (Chrome only) from the GitHub repository

**1. Get the extension files by one of the 2 methods**:

- Clone from GitHub:

```bash
git clone https://github.com/913-groza-vlad/ai_summarizer.git
```

- Download ZIP

```
Click Code → Download ZIP on Github
Extract the ZIP file
```

**2. Load in Chrome**

- Navigate to `chrome://extensions`
- Enable Developer mode
- Click "Load unpacked"
- Select the extracted folder

## Setup

After installation:

- Click the extension icon (🧩) in Chrome's toolbar
- Select "Options"
- Enter your Cohere API key (a trial key can be generated from Cohere Dashboard)
- Configure default summary length

![options_page](./screenshots/options_page.png)

## Usage/Example

To generate and manage summaries the following steps can be followed:

- **Generate a summary**

  1. Select the text you want to summarize
  2. Right-click and select "Summarize selection" from the context menu ![highlight text & context menu](./screenshots/highlight_context_menu.png)
  3. A summary of the length set from the options page (short in this case) is generated and displayed on the screen ![summary generator](./screenshots/short_summary.png)

- **Regenerate summary by adjusting summary length**:

  1. Use the dropdown to switch between:
     - Short (1-2 sentences)
     - Medium (3-5 sentences)
     - Long (6-8 sentences)
  2. The extension will regenerate the summary ![switch summary length](./screenshots/new_summary.png)
  3. The newly generated content is displayed: ![medium summary](./screenshots/medium_summary.png)

- **Copy, save and manage summaries**
  - Click 'Copy' button to save the summary to clipboard
  - Click 'Save' button to store the content in the history list, which contains previously saved summaries (A message can be seen if the save action is completed successfully)
  - Access saved summaries by clicking on the extension icon. A popup appears where we can visualize the summaries stored. These elements can be expanded to view the full summary text, but we can also delete a summary if it is not needed anymore
    ![extension popup](./screenshots/popup_extension.png)
- **Error handling**:
  If there is an error when we try to generate a summary, a clear error message is displayed, so the user is aware of the reason for which the content was not generated. Usually, the errors are caused by exceeding the usage limit in case of a trial key and by setting an incorrect key or not setting a key at all (this is the situation in the image below).
  ![error handling](./screenshots/error_handling.png)

## Support

For support, report issues at: https://github.com/913-groza-vlad/ai_summarizer

Cohere API support: [support@cohere.com]
