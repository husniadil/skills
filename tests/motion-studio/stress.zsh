# Renders a clip page 12 times, 3 at a time, and counts clip frames off. usage: zsh stress.zsh <page> <label>
HERE=${0:A:h}; cd $HERE; export NODE_PATH=${NODE_PATH:-$HERE/node_modules}; R=${HERE:h:h}/plugins/husniadil-skills/skills/motion-studio/scripts/render.mjs
page=$1; label=$2; total=0; notes=""; t0=$SECONDS
for round in 1 2 3 4; do
  for lane in 1 2 3; do node $R "$page" --seconds 4 --size 640x360 --out out/st-$label-$lane > /dev/null 2>&1 & done; wait
  for lane in 1 2 3; do r=$(node check-clip.mjs out/st-$label-$lane/frames); n=$(echo "$r" | tail -1 | awk '{print $3}'); total=$((total + n)); [[ $n != 0 ]] && notes="$notes | $(echo "$r" | head -2 | tr '\n' ' ')"; done
done
echo "$label: $total clip frames off in 12 renders, 3 at a time, $((SECONDS - t0)) s$notes"
