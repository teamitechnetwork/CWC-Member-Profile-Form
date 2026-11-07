import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubmitMember } from '@workspace/api-client-react';
import type { CwcMemberFormSubmission, MemberProfileInput } from '@workspace/api-client-react';
import type { Path, UseFormRegister } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { ArrowRight, BriefcaseBusiness, Compass, HeartHandshake, UsersRound } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type FieldProps = {
  name: Path<MemberProfileInput>;
  label: string;
  placeholder?: string;
  register: UseFormRegister<MemberProfileInput>;
  required?: boolean;
  type?: string;
  hint?: string;
  errorMessage?: string;
};

function normalizeProfileUrl(value?: string) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function InputField({ name, label, placeholder, register, required, type = 'text', hint, errorMessage }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}{required && <span className="required" aria-hidden="true">*</span>}</label>
      {hint && <p className="field-hint">{hint}</p>}
      <input id={name} type={type} placeholder={placeholder} aria-required={required} aria-invalid={!!errorMessage} aria-describedby={errorMessage ? `${name}-error` : undefined} data-testid={`input-${name}`} {...register(name, {
        ...(required ? { required: `${label} is required` } : {}),
        ...(type === 'email' ? { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' } } : {}),
        ...(type === 'url' ? {
          validate: (value: string | undefined) => {
            if (!value?.trim()) return true;
            try {
              return Boolean(new URL(normalizeProfileUrl(value)).hostname) || 'Enter a valid URL';
            } catch {
              return 'Enter a valid URL';
            }
          },
        } : {}),
      })} />
      {errorMessage && <p className="error-text" id={`${name}-error`} role="alert">{errorMessage}</p>}
    </div>
  );
}

function TextField({ name, label, placeholder, register, hint }: Omit<FieldProps, 'type' | 'required'> & { rows?: number }) {
  return (
    <div className="field full">
      <label htmlFor={name}>{label}</label>
      {hint && <p className="field-hint">{hint}</p>}
      <textarea id={name} placeholder={placeholder} data-testid={`textarea-${name}`} {...register(name)} />
    </div>
  );
}

const directoryOptions: { value: NonNullable<MemberProfileInput['directoryFields']>[number]; label: string }[] = [
  { value: 'preferredName', label: 'Preferred name' },
  { value: 'currentRole', label: 'Current role' },
  { value: 'organization', label: 'Organization' },
  { value: 'industry', label: 'Industry' },
  { value: 'currentCity', label: 'City' },
  { value: 'professionalProfile', label: 'Professional profile link' },
  { value: 'linkedinProfile', label: 'LinkedIn profile' },
  { value: 'professionalBio', label: 'Professional bio' },
  { value: 'strengths', label: 'Strengths' },
  { value: 'areasOfExpertise', label: 'Areas of expertise' },
  { value: 'businessName', label: 'Business or nonprofit name' },
  { value: 'productsServices', label: 'Products or services' },
];

const directoryLabels: Record<NonNullable<MemberProfileInput['directoryFields']>[number], CwcMemberFormSubmission['Optional member directory'][number]> = {
  preferredName: 'Preferred name',
  currentRole: 'Current role',
  organization: 'Organization',
  industry: 'Industry',
  currentCity: 'City',
  professionalProfile: 'Professional profile link',
  linkedinProfile: 'LinkedIn profile',
  professionalBio: 'Professional bio',
  strengths: 'Strengths',
  areasOfExpertise: 'Areas of expertise',
  businessName: 'Business or nonprofit name',
  productsServices: 'Products or services',
};

function Section({ icon, title, description, children, id }: { icon: ReactNode; title: string; description: string; children: ReactNode; id: string }) {
  return (
    <section className="form-section" id={id} aria-labelledby={`${id}-title`}>
      <div className="section-heading">
        <div className="section-icon" aria-hidden="true">{icon}</div>
        <div><h2 id={`${id}-title`}>{title}</h2><p>{description}</p></div>
      </div>
      {children}
    </section>
  );
}

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand-pair" role="group" aria-label="Columbus Women Connect and partner logos">
          <img className="brand-logo" src="/cwc-logo.png" alt="Columbus Women Connect" data-testid="img-cwc-wordmark" />
          <span className="brand-divider" aria-hidden="true" />
          <img className="partner-logo" src="/cwc-mark.png" alt="Partner organization logo" data-testid="img-partner-logo" />
        </div>
        <div className="header-note">Member profile</div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="brand-pair footer-brand-pair" role="group" aria-label="Columbus Women Connect and partner logos">
          <img className="brand-logo" src="/cwc-logo.png" alt="Columbus Women Connect" data-testid="img-footer-cwc-wordmark" />
          <span className="brand-divider" aria-hidden="true" />
          <img className="partner-logo" src="/cwc-mark.png" alt="Partner organization logo" data-testid="img-footer-partner-logo" />
        </div>
        <div className="footer-copy">A community built on connection, generosity, and growth.</div>
      </div>
    </footer>
  );
}

function SuccessState() {
  return (
    <main className="success-wrap">
      <div className="success-card" role="status" data-testid="status-submission-success">
        <img className="success-mark" src="/cwc-mark.png" alt="" />
        <div className="eyebrow">Profile received</div>
        <h1>Thank you for sharing your story.</h1>
        <p>Your profile has been submitted to Columbus Women Connect. Your voice and perspective help make this community stronger.</p>
        <div className="receipt"><strong>Submission confirmed</strong>Added to the member sheet.</div>
        <p className="success-note">You can close this page. We’re glad you’re here.</p>
      </div>
    </main>
  );
}

const steps = ['About you', 'Your experience', 'What’s next', 'Business', 'Connection'];
const heroPhrases = [
  'your story.',
  'your next chapter.',
  'what you’re building.',
  'the impact you make.',
];

function MemberProfileForm() {
  const [submitted, setSubmitted] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [heroPhrase, setHeroPhrase] = useState(heroPhrases[0]);
  const [heroPhraseIndex, setHeroPhraseIndex] = useState(0);
  const [isDeletingHeroPhrase, setIsDeletingHeroPhrase] = useState(false);
  const mutation = useSubmitMember();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MemberProfileInput>({
    defaultValues: {
      ownsBusiness: false,
      directoryFields: [],
      contactForOpportunities: false,
    },
  });
  const ownsBusiness = watch('ownsBusiness');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHeroPhrase(heroPhrases[0]);
      setHeroPhraseIndex(0);
      setIsDeletingHeroPhrase(false);
      return;
    }

    const phrase = heroPhrases[heroPhraseIndex];
    const isPhraseComplete = heroPhrase === phrase;
    const timeout = window.setTimeout(() => {
      if (isDeletingHeroPhrase) {
        if (heroPhrase.length > 0) {
          setHeroPhrase(heroPhrase.slice(0, -1));
        } else {
          setIsDeletingHeroPhrase(false);
          setHeroPhraseIndex((index) => (index + 1) % heroPhrases.length);
        }
      } else if (isPhraseComplete) {
        setIsDeletingHeroPhrase(true);
      } else {
        setHeroPhrase(phrase.slice(0, heroPhrase.length + 1));
      }
    }, isDeletingHeroPhrase ? 42 : isPhraseComplete ? 1350 : 85);

    return () => window.clearTimeout(timeout);
  }, [heroPhrase, heroPhraseIndex, isDeletingHeroPhrase]);

  const onSubmit = (values: MemberProfileInput) => {
    setRequestError('');
    const data: CwcMemberFormSubmission = {
      'Full name': values.fullName.trim(),
      'What should we call you?': values.preferredName?.trim() ?? '',
      'Email address': values.email.trim(),
      'Phone number': values.phone?.trim() ?? '',
      'Where are you based?': values.currentCity?.trim() ?? '',
      'Professional profile link': values.professionalProfile?.trim() ?? '',
      ...(values.linkedinProfile?.trim() ? { 'LinkedIn profile': normalizeProfileUrl(values.linkedinProfile) } : {}),
      'Current role': values.currentRole?.trim() ?? '',
      Organization: values.organization?.trim() ?? '',
      Industry: values.industry?.trim() ?? '',
      'Years of experience': values.yearsExperience?.trim() ?? '',
      'Your professional bio': values.professionalBio?.trim() ?? '',
      'What are your strengths?': values.strengths?.trim() ?? '',
      'Areas of expertise': values.areasOfExpertise?.trim() ?? '',
      'Certifications & credentials': values.certifications?.trim() ?? '',
      'Languages you speak': values.languages?.trim() ?? '',
      'Achievements you’re proud of': values.achievements?.trim() ?? '',
      'Leadership experience': values.leadershipExperience?.trim() ?? '',
      'Notable projects': values.notableProjects?.trim() ?? '',
      'Highest degree': values.highestDegree?.trim() ?? '',
      'Relevant training': values.relevantTraining?.trim() ?? '',
      'What are your short-term goals?': values.shortTermGoals?.trim() ?? '',
      'What’s your longer-term vision?': values.longTermVision?.trim() ?? '',
      'What skills are you developing?': values.developingSkills?.trim() ?? '',
      'How would you like to contribute?': values.communityContribution?.trim() ?? '',
      'What opportunities are you seeking?': values.opportunitiesSeeking?.trim() ?? '',
      'Causes close to your heart': values.passionateCauses?.trim() ?? '',
      'Do you currently own or operate a business?': values.ownsBusiness,
      ...(values.ownsBusiness ? {
        ...(values.businessType ? { 'Is this a business or a nonprofit?': values.businessType } : {}),
        ...(values.businessName?.trim() ? { 'Business name': values.businessName.trim() } : {}),
        ...(values.businessDescription?.trim() ? { 'What is your business or nonprofit for?': values.businessDescription.trim() } : {}),
        ...(values.productsServices?.trim() ? { 'What do you offer?': values.productsServices.trim() } : {}),
        ...(values.idealClients?.trim() ? { 'Who do you love working with?': values.idealClients.trim() } : {}),
      } : {}),
      'A value that guides you': values.guidingValue?.trim() ?? '',
      'One thing you’d like members to know about you': values.oneThingToKnow?.trim() ?? '',
      'Would you like to be contacted about opportunities?': values.contactForOpportunities,
      'Optional member directory': (values.directoryFields ?? []).map((field) => directoryLabels[field]),
      'What are your expectations of CWC? What recommendations would you like to share?': values.expectationsAndRecommendations?.trim() ?? '',
    };
    mutation.mutate({ data }, {
      onSuccess: (result) => {
        if (result && result.ok === true) {
          setSubmitted(true);
          return;
        }

        const responseError = result && typeof result === 'object' && 'error' in result
          ? result.error
          : undefined;
        setRequestError(typeof responseError === 'string' ? responseError : 'We couldn’t add your profile to the member sheet. Please try again. Your answers are still here.');
      },
      onError: (error) => {
        const data = error && typeof error === 'object' && 'data' in error
          ? (error as { data?: unknown }).data
          : undefined;
        const serverMessage = data && typeof data === 'object' && 'error' in data
          ? (data as { error?: unknown }).error
          : undefined;
        setRequestError(typeof serverMessage === 'string' ? serverMessage : 'We couldn’t add your profile to the member sheet. Please try again. Your answers are still here.');
      },
    });
  };

  if (submitted) return <SuccessState />;

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">Columbus Women Connect</div>
          <h1 aria-label="There’s more to your story. Let’s get to know you.">
            There’s more to<br />
            <em aria-hidden="true">{heroPhrase}<span className="hero-typing-caret" /></em>
          </h1>
          <p className="hero-copy">Tell us what you do, what you’re working toward, and how you’d like to connect. Your profile helps us create more meaningful introductions and opportunities across our community.</p>
          <div className="hero-bottom"><span>Share only what feels right</span><i aria-hidden="true" /><span>About 8 minutes to complete</span></div>
        </div>
      </section>

      <main className="form-layout">
        <aside className="form-aside" aria-label="Profile sections">
          <p className="aside-title">Your profile, in your words</p>
          <nav className="step-list" aria-label="Form sections">
            {steps.map((step, index) => <div className={`step-item${index === 0 ? ' active' : ''}`} key={step}><span className="step-number">{String(index + 1).padStart(2, '0')}</span>{step}</div>)}
          </nav>
          <div className="aside-note"><strong>Your profile stays yours.</strong>Directory sharing is completely optional. You choose which details, if any, can be visible to other members.</div>
        </aside>

        <form className="profile-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Section id="about-you" icon={<UsersRound size={18} />} title="A little about you" description="Start with the details that help us welcome you in.">
            <div className="field-grid">
              <InputField name="fullName" label="Full name" placeholder="Your name" register={register} required errorMessage={errors.fullName?.message} />
              <InputField name="preferredName" label="What should we call you?" placeholder="Preferred name" register={register} />
              <InputField name="email" label="Email address" placeholder="you@example.com" type="email" register={register} required errorMessage={errors.email?.message} />
              <InputField name="phone" label="Phone number" placeholder="(614) 555-0123" type="tel" register={register} />
              <InputField name="currentCity" label="Where are you based?" placeholder="Columbus, Ohio" register={register} />
              <InputField name="professionalProfile" label="Professional profile link" placeholder="LinkedIn or personal website" register={register} />
              <InputField name="linkedinProfile" label="LinkedIn profile" placeholder="https://www.linkedin.com/in/your-name" type="url" register={register} errorMessage={errors.linkedinProfile?.message} />
            </div>
          </Section>

          <Section id="experience" icon={<BriefcaseBusiness size={18} />} title="Your work & experience" description="Give us a snapshot of the expertise and perspective you bring.">
            <div className="field-grid">
              <InputField name="currentRole" label="Current role" placeholder="Your title or role" register={register} />
              <InputField name="organization" label="Organization" placeholder="Company, institution, or independent" register={register} />
              <InputField name="industry" label="Industry" placeholder="e.g. Healthcare, education, design" register={register} />
              <InputField name="yearsExperience" label="Years of experience" placeholder="e.g. 8 years" register={register} />
              <TextField name="professionalBio" label="Your professional bio" placeholder="A few sentences about your path, your work, and what matters to you professionally." register={register} />
              <TextField name="strengths" label="What are your strengths?" placeholder="The qualities and skills you bring to your work and community…" register={register} />
              <TextField name="areasOfExpertise" label="Areas of expertise" placeholder="Topics, disciplines, or skills others come to you for…" register={register} />
              <TextField name="certifications" label="Certifications & credentials" placeholder="Optional" register={register} />
              <TextField name="languages" label="Languages you speak" placeholder="Optional" register={register} />
              <TextField name="achievements" label="Achievements you’re proud of" placeholder="Milestones, recognition, or moments that feel meaningful to you…" register={register} />
              <TextField name="leadershipExperience" label="Leadership experience" placeholder="Tell us about ways you’ve led, mentored, or supported others…" register={register} />
              <TextField name="notableProjects" label="Notable projects" placeholder="What have you worked on that you’d love others to know about?" register={register} />
              <InputField name="highestDegree" label="Highest degree" placeholder="Optional" register={register} />
              <TextField name="relevantTraining" label="Relevant training" placeholder="Courses, programs, or learning experiences…" register={register} />
            </div>
          </Section>

          <Section id="what-next" icon={<Compass size={18} />} title="Where you’re headed" description="Your next chapter can take many shapes. What’s on your mind?">
            <div className="field-grid">
              <TextField name="shortTermGoals" label="What are your short-term goals?" placeholder="What would you like to make progress on in the coming year?" register={register} />
              <TextField name="longTermVision" label="What’s your longer-term vision?" placeholder="Dream big, or keep it practical. Where do you hope your path leads?" register={register} />
              <TextField name="developingSkills" label="What skills are you developing?" placeholder="What are you curious to learn or get better at?" register={register} />
              <TextField name="communityContribution" label="How would you like to contribute?" placeholder="Ways you might share your time, knowledge, or perspective…" register={register} />
              <TextField name="opportunitiesSeeking" label="What opportunities are you seeking?" placeholder="New roles, collaborators, clients, mentors, speaking opportunities…" register={register} />
              <TextField name="passionateCauses" label="Causes close to your heart" placeholder="What issues or communities are meaningful to you?" register={register} />
            </div>
          </Section>

          <Section id="business" icon={<BriefcaseBusiness size={18} />} title="Business, nonprofit & entrepreneurship" description="If you’re building something of your own, we’d love to hear about it.">
            <div className="field">
              <span className="field-label" id="owns-business-label">Do you currently own or operate a business or nonprofit?<span className="required" aria-hidden="true">*</span></span>
              <div className="choice-row" role="radiogroup" aria-labelledby="owns-business-label">
                <label className="choice-card"><input type="radio" value="true" required data-testid="radio-ownsBusiness-yes" {...register('ownsBusiness', { required: 'Please select an option' , setValueAs: (value) => value === 'true' })} />Yes, I do</label>
                <label className="choice-card"><input type="radio" value="false" data-testid="radio-ownsBusiness-no" {...register('ownsBusiness', { required: 'Please select an option', setValueAs: (value) => value === 'true' })} />Not currently</label>
              </div>
              {errors.ownsBusiness && <p className="error-text" role="alert">{errors.ownsBusiness.message}</p>}
            </div>
            {ownsBusiness && <div className="field-grid" style={{ marginTop: 20 }}>
              <div className="field">
                <label htmlFor="businessType">Is this a business or a nonprofit?</label>
                <select id="businessType" data-testid="select-businessType" {...register('businessType')}>
                  <option value="">Select one</option>
                  <option value="Business">Business</option>
                  <option value="Nonprofit">Nonprofit</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <InputField name="businessName" label="Name of your business or nonprofit" placeholder="What’s it called?" register={register} />
              <TextField name="businessDescription" label="What is your business or nonprofit for?" placeholder="What do you do, and who do you serve?" register={register} />
              <TextField name="productsServices" label="What do you offer?" placeholder="Products, services, or the problem you help solve…" register={register} />
              <TextField name="idealClients" label="Who do you love working with?" placeholder="Tell us about your ideal clients or collaborators…" register={register} />
            </div>}
          </Section>

          <Section id="connection" icon={<HeartHandshake size={18} />} title="Connection & community" description="Help us understand how you’d like to show up and be found.">
            <div className="field-grid">
              <TextField name="guidingValue" label="A value that guides you" placeholder="A word or principle you return to…" register={register} />
              <TextField name="oneThingToKnow" label="One thing you’d like members to know about you" placeholder="A personal detail, a fun fact, or something you’re proud of…" register={register} />
              <div className="field full">
                <span className="field-label">Would you like to be contacted about opportunities?</span>
                <label className="check-option"><input type="checkbox" data-testid="checkbox-contactForOpportunities" {...register('contactForOpportunities')} />Yes, I’m open to being contacted about relevant opportunities.</label>
              </div>
              <div className="field full">
                <span className="field-label">Optional member directory</span>
                <div className="privacy-box"><strong>Your profile is private unless you choose otherwise.</strong> Select specific fields below if you’d like them to appear in the member directory. Nothing is selected by default. Your email and phone number will never appear in the directory.</div>
                <div className="check-list">
                  {directoryOptions.map((option) => <label className="check-option" key={option.value}><input type="checkbox" value={option.value} data-testid={`checkbox-directory-${option.value}`} {...register('directoryFields')} />{option.label}</label>)}
                </div>
              </div>
              <TextField name="expectationsAndRecommendations" label="What are your expectations of CWC? What recommendations would you like to share?" placeholder="What would make CWC valuable to you? What ideas or suggestions would you like us to consider?" register={register} />
            </div>
          </Section>

          {requestError && <div className="submit-error" role="alert" data-testid="status-submit-error">{requestError}</div>}
          <div className="submit-row">
            <p className="submit-caption">
              Fields marked with <span className="required">*</span> are required. You can leave any other question blank.
              <br />
              Your profile is sent to CWC’s member records; directory sharing remains optional.
            </p>
            <button className="submit-button" type="submit" disabled={mutation.isPending} data-testid="button-submit-profile">
              {mutation.isPending ? 'Sending your profile…' : 'Submit my profile'}{!mutation.isPending && <ArrowRight className="submit-arrow" size={18} aria-hidden="true" />}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

function Home() {
  return <div className="page-shell"><SiteHeader /><MemberProfileForm /><SiteFooter /></div>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
