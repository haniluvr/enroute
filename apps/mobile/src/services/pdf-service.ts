import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type ResumeData = {
    personal: {
        fullName: string;
        email: string;
        phone: string;
        linkedin?: string;
        website?: string;
        location?: string;
    };
    summary?: string;
    skills: string[];
    experience: Array<{
        title: string;
        company: string;
        dates: string;
        location?: string;
        description?: string;
        bullets: string[];
    }>;
    education: Array<{
        degree: string;
        school: string;
        year: string;
        location?: string;
        description?: string; // For thesis/awards in CV
    }>;
    // Common / Shared
    languages?: string[];
    certifications?: string[];
    trainings?: string[];
    
    // CV Specific
    researchInterests?: string[];
    academicExperience?: Array<{
        institution: string;
        role: string;
        dates: string;
        pi?: string;
        project?: string;
        description?: string;
    }>;
    publications?: string[];
    presentations?: string[];
    grants?: string[];
    memberships?: string[];

    // Design settings
    design?: {
        templateId: string;
        primaryColor: string;
        fontFamily: string;
    };
};

export class PDFService {
    static async generateResumePDF(data: ResumeData, templateId: string = 'classic') {
        const html = this.getHTMLTemplate(data, templateId);
        
        try {
            const { uri } = await Print.printToFileAsync({ html });
            console.log('PDF generated at:', uri);
            
            if (Platform.OS === 'ios') {
                await Sharing.shareAsync(uri);
            } else {
                await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Download Resume' });
            }
            return uri;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    private static getHTMLTemplate(data: ResumeData, templateId: string = 'clean-modern') {
        const primaryColor = data.design?.primaryColor || '#a78bfa';
        const fontFamily = data.design?.fontFamily === 'Serif' ? 'Georgia, serif' : "'Helvetica Neue', Helvetica, Arial, sans-serif";

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    * { box-sizing: border-box; }
                    body { 
                        font-family: ${fontFamily}; 
                        line-height: 1.6; 
                        color: #1a1a1a; 
                        margin: 0; 
                        padding: 0;
                    }
                    .page { padding: 50px; }
                    .header { margin-bottom: 35px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; }
                    h1 { margin: 0; font-size: 32px; color: #000; letter-spacing: -1px; }
                    .contact-info { margin-top: 10px; font-size: 13px; color: #555; }
                    .contact-item { display: inline-block; margin-right: 15px; }
                    
                    .section { margin-top: 30px; }
                    .section-title { 
                        font-size: 14px; 
                        font-weight: 800; 
                        text-transform: uppercase; 
                        color: ${primaryColor}; 
                        letter-spacing: 1.5px;
                        margin-bottom: 15px;
                    }
                    
                    .item { margin-bottom: 20px; }
                    .item-header { display: flex; justify-content: space-between; align-items: baseline; }
                    .item-title { font-weight: 700; font-size: 16px; color: #000; }
                    .item-meta { font-size: 13px; color: #666; font-weight: 500; }
                    .item-sub { font-style: italic; color: #444; font-size: 14px; margin-top: 2px; }
                    
                    .p-summary { font-size: 14px; color: #333; }
                    ul { padding-left: 18px; margin-top: 8px; }
                    li { margin-bottom: 5px; font-size: 14px; color: #333; }
                    
                    .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px; }
                    .skill-tag { 
                        background: #f0f0f0; 
                        padding: 4px 10px; 
                        border-radius: 4px; 
                        font-size: 12px; 
                        font-weight: 500;
                    }
                </style>
            </head>
            <body>
                <div class="page">
                    <div class="header">
                        <h1>${data.personal.fullName}</h1>
                        <div class="contact-info">
                            <span class="contact-item">✉ ${data.personal.email}</span>
                            <span class="contact-item">✆ ${data.personal.phone}</span>
                            ${data.personal.location ? `<span class="contact-item">📍 ${data.personal.location}</span>` : ''}
                            ${data.personal.linkedin ? `<span class="contact-item">in ${data.personal.linkedin}</span>` : ''}
                        </div>
                    </div>

                    ${data.summary ? `
                    <div class="section">
                        <div class="section-title">Profile Summary</div>
                        <div class="p-summary">${data.summary}</div>
                    </div>
                    ` : ''}

                    ${data.experience?.length ? `
                    <div class="section">
                        <div class="section-title">Professional Experience</div>
                        ${data.experience.map(exp => `
                            <div class="item">
                                <div class="item-header">
                                    <span class="item-title">${exp.title}</span>
                                    <span class="item-meta">${exp.dates}</span>
                                </div>
                                <div class="item-sub">${exp.company}${exp.location ? ` | ${exp.location}` : ''}</div>
                                ${exp.description ? `<p style="font-size: 14px; margin: 5px 0;">${exp.description}</p>` : ''}
                                ${exp.bullets?.length ? `<ul>${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${data.academicExperience?.length ? `
                    <div class="section">
                        <div class="section-title">Academic & Research Experience</div>
                        ${data.academicExperience.map(exp => `
                            <div class="item">
                                <div class="item-header">
                                    <span class="item-title">${exp.role}</span>
                                    <span class="item-meta">${exp.dates}</span>
                                </div>
                                <div class="item-sub">${exp.institution}${exp.project ? ` | ${exp.project}` : ''}</div>
                                ${exp.description ? `<p style="font-size: 14px; margin: 5px 0;">${exp.description}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${data.education?.length ? `
                    <div class="section">
                        <div class="section-title">Education</div>
                        ${data.education.map(edu => `
                            <div class="item">
                                <div class="item-header">
                                    <span class="item-title">${edu.degree}</span>
                                    <span class="item-meta">${edu.year}</span>
                                </div>
                                <div class="item-sub">${edu.school}${edu.location ? ` | ${edu.location}` : ''}</div>
                                ${edu.description ? `<p style="font-size: 13px; color: #555; margin-top: 5px;">${edu.description}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${data.skills?.length ? `
                    <div class="section">
                        <div class="section-title">Technical Skills</div>
                        <div class="skills-grid">
                            ${data.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}

                    ${data.researchInterests?.length ? `
                    <div class="section">
                        <div class="section-title">Research Interests</div>
                        <p style="font-size: 14px;">${data.researchInterests.join(' • ')}</p>
                    </div>
                    ` : ''}

                    ${data.publications?.length ? `
                    <div class="section">
                        <div class="section-title">Publications & Presentations</div>
                        <ul>${data.publications.map(p => `<li>${p}</li>`).join('')}</ul>
                    </div>
                    ` : ''}

                    ${data.certifications?.length || data.trainings?.length ? `
                    <div class="section">
                        <div class="section-title">Certifications & Professional Development</div>
                        <ul>
                            ${data.certifications?.map(c => `<li>${c}</li>`).join('') || ''}
                            ${data.trainings?.map(t => `<li>${t}</li>`).join('') || ''}
                        </ul>
                    </div>
                    ` : ''}

                    ${data.grants?.length || data.memberships?.length ? `
                    <div class="section">
                        <div class="section-title">Grants, Awards & Memberships</div>
                        <ul>
                            ${data.grants?.map(g => `<li>${g}</li>`).join('') || ''}
                            ${data.memberships?.map(m => `<li>${m}</li>`).join('') || ''}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            </body>
            </html>
        `;
    }
}
