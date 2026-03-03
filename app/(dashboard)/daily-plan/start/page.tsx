import { redirect } from 'next/navigation';
import { getDailyPlanData } from '../actions';

export default async function DailyPlanStartPage() {
  const data = await getDailyPlanData();
  redirect(data.firstStepHref);
}
