# Guidelines for AI-Powered Article Summarization and Analysis

## 1. Introduction

These guidelines serve as the foundational framework for the automated summarization and analysis of news articles within the application. The purpose is to ensure all AI-generated content is consistent, accurate, context-aware, and ethically sound.

By defining clear parameters for our Large Language Models (LLMs), we aim to provide users with reliable, transparent, and valuable insights, helping them navigate information overload effectively while upholding the highest standards of integrity.

## 2. Module 1: Summarization Parameters

This module defines the structural and stylistic rules for generating summaries.

### 2.1. Summarization Length & Format

-   **Standard Summary (Default):**
    -   **Length:** 2-3 sentences.
    -   **Use Case:** Ideal for news card previews and at-a-glance views.
    -   **Goal:** Provide a concise, high-level overview of the article's main topic.

-   **Detailed Summary:**
    -   **Length:** 5-7 sentences.
    -   **Use Case:** Used within the full article modal or dedicated analysis view.
    -   **Goal:** Offer a more comprehensive understanding of the article, covering key points and context, without requiring a full read.

-   **Bulleted Key Points:**
    -   **Length:** 3-5 bullet points.
    -   **Use Case:** An alternative format for presenting the most critical information in a highly scannable way.
    -   **Goal:** Highlight the most important facts, findings, or outcomes.

### 2.2. Summarization Style & Tone

-   **Factual News (Default):** Maintain a strictly objective, neutral, and professional tone. The summary must be factual and avoid any speculation, opinion, or sensationalism.
-   **Opinion & Editorial:** The summary must reflect the author's viewpoint but clearly attribute it. Use phrases like, "The author argues that..." or "According to the piece,..." to distinguish opinion from fact.
-   **Technical/Scientific:** Prioritize the preservation of key terminology, data, and specific findings. These summaries can be slightly longer if necessary to maintain precision.

## 3. Module 2: Content-Specific Dynamics & Ethical Guardrails

This module addresses the need for nuanced handling of sensitive and region-specific content.

### 3.1. Legal, Privacy, and Sensitive Content

-   **Principle of Precision:** When summarizing legal matters, government policies, or topics with significant privacy implications, the summary must be exceptionally precise. There is no room for ambiguity.
-   **No Interpretation:** Do not interpret or extrapolate the meaning of legal or technical jargon. The summary should only reflect what is explicitly stated in the source text.
-   **Anonymization:** For articles (e.g., local crime reports) involving private individuals who are not public figures, the summary should default to using anonymized descriptions ("an individual," "a person involved") unless the person's name is of central and public importance to the story.

### 3.2. Country-Specific & Local Dynamics

-   **Geographical Context:** The summarization model must recognize the article's geographical context. The level of detail for place names should be preserved (e.g., summarize a local city council meeting differently than a UN resolution).
-   **Cultural Sensitivity:** Generate summaries that are culturally neutral. The model should be prompted to avoid interpreting or rephrasing local idioms, customs, or cultural references that could be misconstrued.
-   **Preserve Place Names:** Full names of cities, states, provinces, and key landmarks mentioned in the article must be preserved and not abbreviated unless it's a globally recognized convention (e.g., "U.S.", "U.K.").

## 4. Module 3: Text Analysis Parameters

This module defines the framework for generating analytical insights from articles.

### 4.1. Sentiment Analysis

-   **Scale:** A 5-point scale: `Very Positive`, `Positive`, `Neutral`, `Negative`, `Very Negative`.
-   **Scope:** The analysis must target the overall tone and sentiment of the article, not isolated sentences or quotes.
-   **Distinguishing Fact from Tone:**
    -   For objective news reporting, the sentiment should generally be `Neutral`, even if the subject matter is tragic or distressing (e.g., a report on a natural disaster is factual, and its sentiment is neutral).
    -   For opinion pieces, editorials, or reviews, the sentiment should reflect the author's subjective tone.
-   **Confidence Score:** Every sentiment analysis must be accompanied by a confidence score (0.0 to 1.0) from the model. Scores below a certain threshold (e.g., 0.75) should be flagged, and the sentiment might be displayed with a disclaimer.

---

These guidelines are a living document and will be continuously refined as our AI capabilities and user feedback evolve. The ultimate goal is to build and maintain user trust through responsible, transparent, and effective AI. 