import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubmitMemberProfile } from '@workspace/api-client-react';
import type { MemberProfileInput } from '@workspace/api-client-react';
import type { Path, UseFormRegister } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { ArrowRight, BriefcaseBusiness, Compass, HeartHandshake, Sparkles, UsersRound } from 'lucide-react';
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

function InputField({ name, label, placeholder, register, required, type = 'text', hint, errorMessage }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}{required && <span className="required" aria-hidden="true">*</span>}</label>
      {hint && <p className="field-hint">{hint}</p>}
      <input id={name} type={type} placeholder={placeholder} aria-required={required} aria-invalid={!!errorMessage} aria-describedby={errorMessage ? `${name}-error` : undefined} data-testid={`input-${name}`} {...register(name, {
        ...(required ? { required: `${label} is required` } : {}),
        ...(type === 'email' ? { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' } } : {}),
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
  { value: 'professionalBio', label: 'Professional bio' },
  { value: 'strengths', label: 'Strengths' },
  { value: 'areasOfExpertise', label: 'Areas of expertise' },
  { value: 'businessName', label: 'Business name' },
  { value: 'productsServices', label: 'Products or services' },
];

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

function SuccessState({ receipt }: { receipt: { id: string; submittedAt: string } }) {
  const submitted = new Date(receipt.submittedAt);
  const submittedDate = Number.isNaN(submitted.getTime())
    ? receipt.submittedAt
    : submitted.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <>
      <main className="success-wrap">
        <div className="success-card" role="status" data-testid="status-submission-success">
          <img className="success-mark" src="/cwc-mark.png" alt="" />
          <div className="eyebrow">Profile received</div>
          <h1>Thank you for sharing your story.</h1>
          <p>Your profile has been submitted to Columbus Women Connect. Your voice and perspective help make this community stronger.</p>
          <div className="receipt"><strong>Submission confirmed</strong>Received {submittedDate} · Reference {receipt.id}</div>
          <p className="success-note">You can close this page. We’re glad you’re here.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

const steps = ['About you', 'Your experience', 'What’s next', 'Business', 'Connection'];

function MemberProfileForm() {
  const [receipt, setReceipt] = useState<{ id: string; submittedAt: string } | null>(null);
  const [requestError, setRequestError] = useState('');
  const mutation = useSubmitMemberProfile();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MemberProfileInput>({
    defaultValues: {
      ownsBusiness: false,
      directoryFields: [],
      contactForOpportunities: false,
    },
  });
  const ownsBusiness = watch('ownsBusiness');

  const onSubmit = (values: MemberProfileInput) => {
    setRequestError('');
    const data: MemberProfileInput = {
      ...values,
      directoryFields: values.directoryFields ?? [],
      ...(values.ownsBusiness ? {} : { businessName: undefined, productsServices: undefined, idealClients: undefined }),
    };
    mutation.mutate({ data }, {
      onSuccess: (result: { id: string; submittedAt: string }) => setReceipt(result),
      onError: () => setRequestError('We couldn’t submit your profile just now. Please check your connection and try again. Your answers are still here.'),
    });
  };

  if (receipt) return <SuccessState receipt={receipt} />;

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">Columbus Women Connect</div>
          <h1>There’s more to your story.<br /><em>Let’s get to know you.</em></h1>
          <p className="hero-copy">Tell us what you do, what you’re working toward, and how you’d like to connect. Your profile helps us create more meaningful introductions and opportunities across our community.</p>
          <div className="hero-bottom"><span><Sparkles size={15} aria-hidden="true" /> Share only what feels right</span><i aria-hidden="true" /><span>About 8 minutes to complete</span></div>
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

          <Section id="business" icon={<BriefcaseBusiness size={18} />} title="Business & entrepreneurship" description="If you’re building something of your own, we’d love to hear about it.">
            <div className="field">
              <span className="field-label" id="owns-business-label">Do you currently own or operate a business?<span className="required" aria-hidden="true">*</span></span>
              <div className="choice-row" role="radiogroup" aria-labelledby="owns-business-label">
                <label className="choice-card"><input type="radio" value="true" required data-testid="radio-ownsBusiness-yes" {...register('ownsBusiness', { required: 'Please select an option' , setValueAs: (value) => value === 'true' })} />Yes, I do</label>
                <label className="choice-card"><input type="radio" value="false" data-testid="radio-ownsBusiness-no" {...register('ownsBusiness', { required: 'Please select an option', setValueAs: (value) => value === 'true' })} />Not currently</label>
              </div>
              {errors.ownsBusiness && <p className="error-text" role="alert">{errors.ownsBusiness.message}</p>}
            </div>
            {ownsBusiness && <div className="field-grid" style={{ marginTop: 20 }}>
              <InputField name="businessName" label="Business name" placeholder="What’s it called?" register={register} />
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
            <p className="submit-caption">Fields marked with <span className="required">*</span> are required. You can leave any other question blank.</p>
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
