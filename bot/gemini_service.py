from google import genai
from google.genai import types
from config import GEMINI_API_KEY, get_inna_context

# Initialize the Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

def generate_post(media_bytes: bytes, mime_type: str, original_caption: str = None, previous_draft: str = None, feedback: str = None) -> str:
    """
    Calls the Gemini API to generate a social media post based on an uploaded image/video.
    Supports "rethinking" by taking previous drafts and user feedback into account.
    """
    
    inna_context = get_inna_context()
    quote_lines = "\n".join(f'    - "{quote}"' for quote in inna_context["quotes"])

    prompt = f"""
    You are an AI Social Media Agent for Inna, a Shiatsu practitioner in Tel Aviv.
    
    CONTEXT:
    - Name: {inna_context['name']}
    - Specialty: {inna_context['specialty']}
    - Target Audience: {inna_context['targetAudience']}
    - Voice: {inna_context['voice']['tone']}. {inna_context['voice']['style']}
    - Forbidden Words: {', '.join(inna_context['voice']['forbiddenWords'])}
    
    INNA'S DIRECT QUOTES FOR VOICE REFERENCE:
{quote_lines}
    """
    
    if previous_draft and feedback:
        # Rethinking flow
        prompt += f"\n\nPREVIOUS DRAFT:\n{previous_draft}\n"
        prompt += f"\nINNA'S FEEDBACK:\n{feedback}\n"
        prompt += "\nTASK: Rewrite the social media post for the attached image/video based on Inna's feedback. Keep it in Hebrew, natural, and warm. Include relevant hashtags."
    else:
        # Initial generation flow
        prompt += "\n\nTASK: Write a social media post (Instagram/Facebook) in Hebrew for the attached image/video."
        if original_caption:
            prompt += f"\nInna provided this context/caption with the upload: {original_caption}"
        prompt += "\nKeep it natural, warm, and in the first person. Include relevant hashtags."

    try:
        # Call the Gemini model with multimodal input (image/video + text)
        response = client.models.generate_content(
            model='gemini-3.1-flash-preview',
            contents=[
                types.Part.from_bytes(data=media_bytes, mime_type=mime_type),
                prompt
            ]
        )
        return response.text
        
    except Exception as e:
        print(f"Error generating content with Gemini: {e}")
        return "❌ שגיאה ביצירת התוכן. אנא נסי שוב מאוחר יותר."
